export interface SolaceConfig {
	url: string;
	vpnName: string;
	userName: string;
	password: string;
	topic: string;
}

export function getSolaceConfig(): SolaceConfig {
	// Try import.meta.env directly
	const metaEnv = import.meta.env;

	const config = {
		url: metaEnv.VITE_SOLACE_URL || 'wss://mr-connection-kcqhqhqhqh.messaging.solace.cloud:443',
		vpnName: metaEnv.VITE_SOLACE_VPN_NAME || 'candy-trap-demo',
		userName: metaEnv.VITE_SOLACE_USERNAME || 'candy-trap-user',
		password: metaEnv.VITE_SOLACE_PASSWORD || 'candy123',
		topic: metaEnv.VITE_SOLACE_TOPIC || 'CANDY/ALERT'
	};

	return config;
}

export function validateSolaceConfig(config: SolaceConfig): boolean {
	return !!(config.url && config.vpnName && config.userName && config.password && config.topic);
}