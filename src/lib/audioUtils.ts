// Audio utilities for generating alarm sounds
// Mobile browsers require user interaction before playing audio

export class AlarmGenerator {
	private audioContext: AudioContext | null = null;
	private oscillator: OscillatorNode | null = null;
	private gainNode: GainNode | null = null;
	private isPlaying = false;
	private isUnlocked = false;

	constructor() {
		// Don't create AudioContext in constructor - wait for user interaction
	}

	// Call this on first user interaction (button click) to unlock audio
	async unlockAudio(): Promise<void> {
		if (this.isUnlocked) return;

		try {
			if (typeof window !== 'undefined') {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
				
				// Resume if suspended (required for mobile)
				if (this.audioContext.state === 'suspended') {
					await this.audioContext.resume();
				}

				// Play a silent sound to unlock audio on mobile
				const silentOscillator = this.audioContext.createOscillator();
				const silentGain = this.audioContext.createGain();
				silentGain.gain.value = 0; // Silent
				silentOscillator.connect(silentGain);
				silentGain.connect(this.audioContext.destination);
				silentOscillator.start();
				silentOscillator.stop(this.audioContext.currentTime + 0.001);

				this.isUnlocked = true;
				console.log('🔊 Audio unlocked for mobile');
			}
		} catch (error) {
			console.error('Error unlocking audio:', error);
		}
	}

	async playAlarm(): Promise<void> {
		if (this.isPlaying) return;

		try {
			// Ensure audio context exists
			if (!this.audioContext && typeof window !== 'undefined') {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			}

			if (!this.audioContext) return;

			// Resume audio context if suspended (required for mobile)
			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}

			this.isPlaying = true;
			this.createAlarmSound();
			console.log('🔔 Alarm sound playing');
		} catch (error) {
			console.error('Error playing alarm:', error);
		}
	}

	stopAlarm(): void {
		if (this.oscillator) {
			try {
				this.oscillator.stop();
				this.oscillator.disconnect();
			} catch (e) {
				// Ignore errors if already stopped
			}
			this.oscillator = null;
		}
		if (this.gainNode) {
			try {
				this.gainNode.disconnect();
			} catch (e) {
				// Ignore errors
			}
			this.gainNode = null;
		}
		this.isPlaying = false;
	}

	private createAlarmSound(): void {
		if (!this.audioContext) return;

		// Create oscillator for the alarm sound
		this.oscillator = this.audioContext.createOscillator();
		this.gainNode = this.audioContext.createGain();

		// Connect nodes
		this.oscillator.connect(this.gainNode);
		this.gainNode.connect(this.audioContext.destination);

		// Configure alarm sound (alternating high-low frequency)
		this.oscillator.type = 'square';
		this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
		
		// Create alternating pattern
		let time = this.audioContext.currentTime;
		for (let i = 0; i < 20; i++) {
			const freq = i % 2 === 0 ? 800 : 600;
			this.oscillator.frequency.setValueAtTime(freq, time);
			time += 0.25;
		}

		// Set volume
		this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

		// Start the sound
		this.oscillator.start();
		
		// Stop after 5 seconds
		this.oscillator.stop(this.audioContext.currentTime + 5);
		
		this.oscillator.onended = () => {
			this.stopAlarm();
		};
	}
}

// Preload and prepare audio file for mobile playback
export async function loadAudioFile(url: string): Promise<HTMLAudioElement | null> {
	try {
		const audio = new Audio(url);
		
		// Set attributes for better mobile support
		audio.preload = 'auto';
		audio.setAttribute('playsinline', 'true');
		audio.setAttribute('webkit-playsinline', 'true');
		
		return new Promise((resolve) => {
			audio.addEventListener('canplaythrough', () => {
				console.log('🎵 Audio file loaded:', url);
				resolve(audio);
			}, { once: true });
			
			audio.addEventListener('error', (e) => {
				console.error('❌ Audio file error:', e);
				resolve(null);
			}, { once: true });
			
			// Start loading
			audio.load();
		});
	} catch (error) {
		console.error('Error loading audio file:', error);
		return null;
	}
}

// Helper to play audio with mobile support
export async function playAudioWithMobileSupport(audio: HTMLAudioElement): Promise<boolean> {
	try {
		// Reset to beginning
		audio.currentTime = 0;
		
		// Try to play
		const playPromise = audio.play();
		
		if (playPromise !== undefined) {
			await playPromise;
			console.log('🔊 Audio playing successfully');
			return true;
		}
		return true;
	} catch (error) {
		console.error('❌ Error playing audio:', error);
		return false;
	}
}