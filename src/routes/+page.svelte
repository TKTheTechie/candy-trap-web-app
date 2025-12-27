<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { AlarmGenerator, loadAudioFile } from '$lib/audioUtils';
	import { getSolaceConfig, validateSolaceConfig } from '$lib/config';

	let currentScreen: 'splash' | 'scanning' | 'alert' = 'splash';
	let isConnected = false;
	let isAlertActive = false;
	let solaceSession: any = null;
	let alarmAudio: HTMLAudioElement | null = null;
	let alarmGenerator: AlarmGenerator | null = null;
	let connectionStatus = 'Disconnected';
	let scanningPercentage = 0;
	let thermalPercentage = 0;
	let scanningInterval: number;

	// Solace connection configuration from environment variables
	const SOLACE_CONFIG = getSolaceConfig();

	onMount(async () => {
		if (browser) {
			// Initialize alarm generator
			alarmGenerator = new AlarmGenerator();
			
			// Try to load alarm audio file
			alarmAudio = await loadAudioFile(`${base}/alarm.mp3`);
			if (!alarmAudio) {
				console.log('Using generated alarm sound as fallback');
			}
		}
	});

	onDestroy(() => {
		if (solaceSession) {
			solaceSession.disconnect();
		}
		if (alarmGenerator) {
			alarmGenerator.stopAlarm();
		}
		if (scanningInterval) {
			clearInterval(scanningInterval);
		}
	});

	async function connectToSolace() {
		if (!browser) return;

		// REAL SOLACE CONNECTION - NO SIMULATION - v2.0
		console.log('🔥 REAL SOLACE CONNECTION STARTING - NO SIMULATION');

		// Validate configuration
		if (!validateSolaceConfig(SOLACE_CONFIG)) {
			console.error('Invalid Solace configuration. Please check your environment variables.');
			connectionStatus = 'Configuration Error';
			return;
		}

		connectionStatus = 'Connecting...';

		try {
			console.log('Attempting to connect to Solace...');
			
			// Real Solace implementation
			console.log('Importing solclientjs...');
			const solace = await import('solclientjs');
			console.log('Solace client imported successfully:', !!solace);
			console.log('Solace version:', solace.SolclientFactory?.version || 'unknown');
			
			if (!solace || !solace.SolclientFactory) {
				throw new Error('Solace client library not available');
			}

			console.log('Initializing Solace factory...');
			
			// Check if factory is already initialized
			try {
				const factoryProps = new solace.SolclientFactoryProperties();
				factoryProps.profile = solace.SolclientFactoryProfiles.version10;
				
				// Try to initialize - this might fail if already initialized
				try {
					solace.SolclientFactory.init(factoryProps);
					console.log('Solace factory initialized');
				} catch (initError) {
					console.log('Factory already initialized or init error:', initError.message);
				}
			} catch (factoryError) {
				console.log('Factory setup error:', factoryError.message);
			}

			console.log('Creating session properties...');
			const sessionProps = new solace.SessionProperties();
			sessionProps.url = SOLACE_CONFIG.url;
			sessionProps.vpnName = SOLACE_CONFIG.vpnName;
			sessionProps.userName = SOLACE_CONFIG.userName;
			sessionProps.password = SOLACE_CONFIG.password;
			sessionProps.connectTimeoutInMsecs = 10000;
			sessionProps.readTimeoutInMsecs = 10000;

			console.log('Creating Solace session...');
			solaceSession = solace.SolclientFactory.createSession(sessionProps);
			console.log('Solace session created:', !!solaceSession);

			// Set up basic event handlers only
			console.log('Setting up basic event handlers...');
			
			// Use string event names as fallback if event codes are problematic
			try {
				solaceSession.on(solace.SessionEventCode.UP_NOTICE, () => {
					console.log('✅ Connected to Solace broker successfully!');
					isConnected = true;
					connectionStatus = 'Connected';
					subscribeToTopic();
				});
			} catch (e) {
				console.error('Error setting UP_NOTICE handler:', e);
			}

			try {
				solaceSession.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent: any) => {
					console.error('❌ Connection failed:', sessionEvent?.infoStr || 'Unknown error');
					connectionStatus = `Connection Failed: ${sessionEvent?.infoStr || 'Unknown error'}`;
					isConnected = false;
				});
			} catch (e) {
				console.error('Error setting CONNECT_FAILED_ERROR handler:', e);
			}

			try {
				solaceSession.on(solace.SessionEventCode.DISCONNECT_NOTICE, () => {
					console.log('🔌 Disconnected from Solace');
					isConnected = false;
					connectionStatus = 'Disconnected';
				});
			} catch (e) {
				console.error('Error setting DISCONNECT_NOTICE handler:', e);
			}

			try {
				solaceSession.on(solace.SessionEventCode.MESSAGE, handleMessage);
			} catch (e) {
				console.error('Error setting MESSAGE handler:', e);
			}

			// Set a connection timeout
			const connectionTimeout = setTimeout(() => {
				if (!isConnected) {
					console.error('⏰ Connection timeout after 15 seconds');
					connectionStatus = 'Connection Timeout';
					if (solaceSession) {
						try {
							solaceSession.disconnect();
						} catch (e) {
							console.error('Error disconnecting on timeout:', e);
						}
					}
				}
			}, 15000);

			console.log('🚀 Initiating connection to Solace broker...');
			solaceSession.connect();

			// Clear timeout if connection succeeds
			if (isConnected) {
				clearTimeout(connectionTimeout);
			}
			
		} catch (error) {
			console.error('❌ Error connecting to Solace:', error);
			console.error('Error details:', {
				message: error.message,
				stack: error.stack,
				name: error.name
			});
			connectionStatus = `Connection Error: ${error.message}`;
		}
	}

	function subscribeToTopic() {
		if (!solaceSession || !browser) return;

		try {
			console.log('🔔 Starting subscription process...');
			// Import solace dynamically to get the factory
			import('solclientjs').then((solace) => {
				console.log('Creating topic destination for:', SOLACE_CONFIG.topic);
				const topic = solace.SolclientFactory.createTopicDestination(SOLACE_CONFIG.topic);
				
				console.log('Subscribing to topic...');
				solaceSession.subscribe(
					topic,
					true, // requestConfirmation
					'CANDY_ALERT_SUB', // correlationKey
					10000 // requestTimeout
				);
				
				console.log(`📡 Subscription request sent for ${SOLACE_CONFIG.topic}`);
			}).catch((error) => {
				console.error('❌ Error importing solace for subscription:', error);
			});
		} catch (error) {
			console.error('❌ Error subscribing to topic:', error);
		}
	}

	function handleMessage(message: any) {
		try {
			console.log('Alert message received!');
			
			// Try to get message content
			let messageContent = '';
			if (message.getBinaryAttachment) {
				messageContent = message.getBinaryAttachment();
			} else if (message.getSdtContainer) {
				messageContent = message.getSdtContainer();
			} else if (message.getDestination) {
				console.log('Message received on topic:', message.getDestination().getName());
			}
			
			console.log('Message content:', messageContent);
			triggerAlert();
		} catch (error) {
			console.error('Error handling message:', error);
			// Still trigger alert even if we can't parse the message
			triggerAlert();
		}
	}

	async function triggerAlert() {
		isAlertActive = true;
		
		// Play alarm sound
		if (alarmAudio) {
			try {
				alarmAudio.loop = true;
				await alarmAudio.play();
			} catch (error) {
				console.error('Error playing audio file:', error);
				// Fallback to generated sound
				if (alarmGenerator) {
					alarmGenerator.playAlarm();
				}
			}
		} else if (alarmGenerator) {
			// Use generated alarm sound
			alarmGenerator.playAlarm();
		}

		// Stop alert after 5 seconds
		setTimeout(() => {
			isAlertActive = false;
			if (alarmAudio) {
				alarmAudio.pause();
				alarmAudio.currentTime = 0;
			}
			if (alarmGenerator) {
				alarmGenerator.stopAlarm();
			}
		}, 5000);
	}

	function startScanning() {
		currentScreen = 'scanning';
		connectToSolace();
		
		// Start scanning animation counters
		if (browser) {
			scanningInterval = setInterval(() => {
				scanningPercentage = Math.min(100, scanningPercentage + Math.random() * 15);
				thermalPercentage = Math.min(100, thermalPercentage + Math.random() * 12);
				
				// Reset counters when they reach 100%
				if (scanningPercentage >= 100 && thermalPercentage >= 100) {
					setTimeout(() => {
						scanningPercentage = 0;
						thermalPercentage = 0;
					}, 2000);
				}
			}, 500);
		}
	}

	function resetApp() {
		currentScreen = 'splash';
		isConnected = false;
		isAlertActive = false;
		connectionStatus = 'Disconnected';
		scanningPercentage = 0;
		thermalPercentage = 0;
		
		// Clear scanning interval
		if (scanningInterval) {
			clearInterval(scanningInterval);
		}
		
		if (solaceSession) {
			solaceSession.disconnect();
			solaceSession = null;
		}
		if (alarmGenerator) {
			alarmGenerator.stopAlarm();
		}
	}

	// Manual disconnect function
	function disconnectFromSolace() {
		if (solaceSession) {
			console.log('Manually disconnecting from Solace...');
			solaceSession.disconnect();
		}
	}
</script>

<main class="min-h-screen bg-gradient-to-br from-cub-yellow via-cub-yellow-light to-cub-blue relative overflow-hidden">
	<!-- LEGO brick pattern background -->
	<div class="absolute inset-0 opacity-20">
		<div class="grid grid-cols-8 gap-4 h-full w-full p-4">
			{#each Array(64) as _, i}
				<div class="bg-cub-blue rounded-full w-4 h-4"></div>
			{/each}
		</div>
	</div>

	{#if currentScreen === 'splash'}
		<!-- Splash Screen -->
		<div class="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
			<!-- Title with LEGO brick styling -->
			<div class="text-center mb-12">
				<h1 class="text-4xl md:text-6xl lg:text-8xl font-bold text-cub-blue mb-4 tracking-wider drop-shadow-lg">
					CANDY TRAP
				</h1>
				<h2 class="text-2xl md:text-4xl lg:text-5xl font-bold text-cub-blue-dark mb-8 tracking-wide drop-shadow-lg">
					ALERT
				</h2>
				
				<!-- LEGO brick decoration -->
				<div class="flex justify-center space-x-4 mb-8">
					<div class="w-16 h-16 bg-cub-blue rounded-lg border-4 border-cub-yellow shadow-lg relative">
						<div class="absolute top-2 left-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
						<div class="absolute top-2 right-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
						<div class="absolute bottom-2 left-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
						<div class="absolute bottom-2 right-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
					</div>
					<div class="w-16 h-16 bg-cub-yellow rounded-lg border-4 border-cub-blue shadow-lg relative">
						<div class="absolute top-2 left-2 w-3 h-3 bg-cub-blue rounded-full"></div>
						<div class="absolute top-2 right-2 w-3 h-3 bg-cub-blue rounded-full"></div>
						<div class="absolute bottom-2 left-2 w-3 h-3 bg-cub-blue rounded-full"></div>
						<div class="absolute bottom-2 right-2 w-3 h-3 bg-cub-blue rounded-full"></div>
					</div>
					<div class="w-16 h-16 bg-cub-blue-light rounded-lg border-4 border-cub-yellow shadow-lg relative">
						<div class="absolute top-2 left-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
						<div class="absolute top-2 right-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
						<div class="absolute bottom-2 left-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
						<div class="absolute bottom-2 right-2 w-3 h-3 bg-cub-yellow rounded-full"></div>
					</div>
				</div>
			</div>

			<!-- LEGO-style START button -->
			<button
				on:click={startScanning}
				class="bg-cub-yellow text-cub-blue px-12 py-6 rounded-2xl text-2xl md:text-3xl font-bold uppercase tracking-wider border-4 border-cub-blue shadow-lego hover:shadow-lego-hover active:shadow-lego-active transform hover:-translate-y-1 active:translate-y-1 transition-all duration-200 relative"
			>
				<!-- LEGO studs on button -->
				<div class="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-4">
					<div class="w-4 h-4 bg-cub-blue rounded-full"></div>
					<div class="w-4 h-4 bg-cub-blue rounded-full"></div>
					<div class="w-4 h-4 bg-cub-blue rounded-full"></div>
				</div>
				<span class="mt-4 block">START</span>
			</button>
		</div>
	{/if}

	{#if currentScreen === 'scanning'}
		<!-- Scanning Screen -->
		<div class="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
			<!-- Alert panel with LEGO styling -->
			<div class="bg-white rounded-3xl border-8 border-cub-blue p-8 md:p-12 max-w-2xl w-full text-center relative shadow-2xl {isAlertActive ? 'animate-flash' : ''}">
				<!-- LEGO studs on top of panel -->
				<div class="absolute -top-4 left-1/2 transform -translate-x-1/2 flex space-x-6">
					<div class="w-6 h-6 bg-cub-blue rounded-full"></div>
					<div class="w-6 h-6 bg-cub-blue rounded-full"></div>
					<div class="w-6 h-6 bg-cub-blue rounded-full"></div>
					<div class="w-6 h-6 bg-cub-blue rounded-full"></div>
					<div class="w-6 h-6 bg-cub-blue rounded-full"></div>
				</div>

				<!-- Status indicator / Scanning Animation -->
				<div class="mb-8">
					{#if isAlertActive}
						<!-- Alert Mode - Red warning circle -->
						<div class="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full border-6 border-cub-blue flex items-center justify-center text-4xl md:text-5xl mb-6 bg-lego-red animate-shake">
							⚠️
						</div>
					{:else if isConnected}
						<!-- Scanning Mode - Fancy radar animation -->
						<div class="relative w-48 h-48 md:w-56 md:h-56 mx-auto mb-6">
							<!-- Outer radar ring -->
							<div class="absolute inset-0 border-4 border-cub-blue rounded-full opacity-30 animate-ping"></div>
							<div class="absolute inset-2 border-2 border-cub-blue rounded-full opacity-50 animate-pulse"></div>
							<div class="absolute inset-4 border-2 border-cub-yellow rounded-full opacity-70"></div>
							<div class="absolute inset-8 border border-cub-blue rounded-full opacity-40"></div>
							
							<!-- Center dot -->
							<div class="absolute top-1/2 left-1/2 w-3 h-3 bg-cub-yellow rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
							
							<!-- Scanning beam -->
							<div class="absolute top-1/2 left-1/2 w-0 h-0 transform -translate-x-1/2 -translate-y-1/2">
								<div class="scanning-beam"></div>
							</div>
							
							<!-- Scanning dots around the perimeter -->
							<div class="absolute top-4 left-1/2 w-2 h-2 bg-lego-green rounded-full transform -translate-x-1/2 animate-pulse scan-dot-1"></div>
							<div class="absolute top-1/2 right-4 w-2 h-2 bg-lego-green rounded-full transform -translate-y-1/2 animate-pulse scan-dot-2"></div>
							<div class="absolute bottom-4 left-1/2 w-2 h-2 bg-lego-green rounded-full transform -translate-x-1/2 animate-pulse scan-dot-3"></div>
							<div class="absolute top-1/2 left-4 w-2 h-2 bg-lego-green rounded-full transform -translate-y-1/2 animate-pulse scan-dot-4"></div>
							
							<!-- Corner detection points -->
							<div class="absolute top-8 right-8 w-1 h-1 bg-cub-yellow rounded-full animate-ping scan-corner-1"></div>
							<div class="absolute bottom-8 right-8 w-1 h-1 bg-cub-yellow rounded-full animate-ping scan-corner-2"></div>
							<div class="absolute bottom-8 left-8 w-1 h-1 bg-cub-yellow rounded-full animate-ping scan-corner-3"></div>
							<div class="absolute top-8 left-8 w-1 h-1 bg-cub-yellow rounded-full animate-ping scan-corner-4"></div>
							
							<!-- Scanning grid overlay -->
							<div class="absolute inset-12 grid grid-cols-6 gap-1 opacity-30">
								{#each Array(36) as _, i}
									<div class="w-1 h-1 border border-cub-blue grid-cell" style="animation-delay: {i * 0.1}s"></div>
								{/each}
							</div>
						</div>
						
						<!-- Progress bars inside the white box -->
						<div class="w-full max-w-md mx-auto space-y-3 mb-4">
							<div class="flex justify-between text-xs text-cub-blue">
								<span>🎯 Motion Detection</span>
								<span class="font-mono">{Math.round(scanningPercentage)}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div class="bg-cub-blue h-2 rounded-full transition-all duration-500" style="width: {scanningPercentage}%"></div>
							</div>
							
							<div class="flex justify-between text-xs text-cub-blue">
								<span>🌡️ Thermal Analysis</span>
								<span class="font-mono">{Math.round(thermalPercentage)}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div class="bg-cub-yellow h-2 rounded-full transition-all duration-500" style="width: {thermalPercentage}%"></div>
							</div>
						</div>
						
						<!-- Scanning status text -->
						<div class="text-sm text-cub-blue opacity-75 scanning-text mb-4">
							Analyzing motion patterns...
						</div>
					{:else}
						<!-- Connecting Mode - Simple pulsing circle -->
						<div class="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full border-6 border-cub-blue flex items-center justify-center text-4xl md:text-5xl mb-6 bg-gray-300 animate-pulse">
							🔌
						</div>
					{/if}
				</div>

				<!-- Status text -->
				<h2 class="text-2xl md:text-4xl font-bold mb-6 {isAlertActive ? 'text-white' : 'text-cub-blue'}">
					{#if isAlertActive}
						🚨 INTRUDER DETECTED! 🚨
					{:else if isConnected}
						Scanning for Intruders...
					{:else}
						Connecting to Security System...
					{/if}
				</h2>

				<!-- Connection status -->
				<div class="mb-8">
					<div class="flex flex-col items-center space-y-2">
						<div class="flex items-center space-x-2 text-lg">
							<div class="w-4 h-4 rounded-full {isConnected ? 'bg-lego-green' : connectionStatus.includes('Error') || connectionStatus.includes('Failed') ? 'bg-lego-red' : 'bg-gray-400'} {isConnected ? 'animate-pulse' : ''}"></div>
							<span class="{isAlertActive ? 'text-white' : 'text-cub-blue'}">
								{connectionStatus}
							</span>
						</div>
						{#if isConnected}
							<div class="text-sm {isAlertActive ? 'text-white' : 'text-cub-blue'} opacity-75">
								Topic: {SOLACE_CONFIG.topic}
							</div>
						{/if}
					</div>
				</div>

				<!-- Action buttons -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<button
						on:click={resetApp}
						class="bg-cub-blue text-white px-6 py-3 rounded-xl text-lg font-bold uppercase tracking-wide border-2 border-white hover:bg-opacity-90 transition-all duration-200"
					>
						Reset System
					</button>
					
					{#if isConnected}
						<button
							on:click={disconnectFromSolace}
							class="bg-gray-600 text-white px-6 py-3 rounded-xl text-lg font-bold uppercase tracking-wide border-2 border-white hover:bg-opacity-90 transition-all duration-200"
						>
							Disconnect
						</button>
					{:else if connectionStatus.includes('Error') || connectionStatus.includes('Failed')}
						<button
							on:click={connectToSolace}
							class="bg-lego-green text-white px-6 py-3 rounded-xl text-lg font-bold uppercase tracking-wide border-2 border-white hover:bg-opacity-90 transition-all duration-200"
						>
							Retry Connection
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	@keyframes flash {
		0%, 100% { background-color: white; }
		50% { background-color: #dc2626; }
	}
	
	.animate-flash {
		animation: flash 0.5s infinite;
	}

	/* Scanning beam animation */
	@keyframes scanBeam {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.scanning-beam {
		width: 100px;
		height: 2px;
		background: linear-gradient(90deg, transparent 0%, #FDE047 50%, transparent 100%);
		transform-origin: 0 50%;
		animation: scanBeam 3s linear infinite;
		opacity: 0.8;
	}

	/* Scanning dots animations */
	@keyframes scanDot1 {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		25% { opacity: 1; transform: scale(1.5); }
	}

	@keyframes scanDot2 {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.5); }
	}

	@keyframes scanDot3 {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		75% { opacity: 1; transform: scale(1.5); }
	}

	@keyframes scanDot4 {
		0%, 100% { opacity: 1; transform: scale(1.5); }
		25%, 50%, 75% { opacity: 0.3; transform: scale(1); }
	}

	.scan-dot-1 { animation: scanDot1 4s ease-in-out infinite; }
	.scan-dot-2 { animation: scanDot2 4s ease-in-out infinite; }
	.scan-dot-3 { animation: scanDot3 4s ease-in-out infinite; }
	.scan-dot-4 { animation: scanDot4 4s ease-in-out infinite; }

	/* Corner detection animations */
	.scan-corner-1 { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; animation-delay: 0s; }
	.scan-corner-2 { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; animation-delay: 0.5s; }
	.scan-corner-3 { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; animation-delay: 1s; }
	.scan-corner-4 { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; animation-delay: 1.5s; }

	/* Grid cell animation */
	@keyframes gridScan {
		0%, 90% { background-color: transparent; }
		10%, 80% { background-color: rgba(30, 58, 138, 0.3); }
	}

	.grid-cell {
		animation: gridScan 8s ease-in-out infinite;
	}

	/* Text animations */
	@keyframes scanningText {
		0% { content: "Analyzing motion patterns..."; }
		25% { content: "Checking thermal signatures..."; }
		50% { content: "Scanning for anomalies..."; }
		75% { content: "Processing sensor data..."; }
		100% { content: "Monitoring perimeter..."; }
	}

	.scanning-text::after {
		content: "Analyzing motion patterns...";
		animation: scanningText 8s ease-in-out infinite;
	}
</style>