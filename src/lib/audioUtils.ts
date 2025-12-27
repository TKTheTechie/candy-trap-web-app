// Audio utilities for generating alarm sounds
export class AlarmGenerator {
	private audioContext: AudioContext | null = null;
	private oscillator: OscillatorNode | null = null;
	private gainNode: GainNode | null = null;
	private isPlaying = false;

	constructor() {
		if (typeof window !== 'undefined') {
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		}
	}

	async playAlarm(): Promise<void> {
		if (!this.audioContext || this.isPlaying) return;

		try {
			// Resume audio context if suspended
			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}

			this.isPlaying = true;
			this.createAlarmSound();
		} catch (error) {
			console.error('Error playing alarm:', error);
		}
	}

	stopAlarm(): void {
		if (this.oscillator) {
			this.oscillator.stop();
			this.oscillator.disconnect();
			this.oscillator = null;
		}
		if (this.gainNode) {
			this.gainNode.disconnect();
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

export async function loadAudioFile(url: string): Promise<HTMLAudioElement | null> {
	try {
		const audio = new Audio(url);
		
		return new Promise((resolve) => {
			audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
			audio.addEventListener('error', () => resolve(null), { once: true });
			audio.load();
		});
	} catch (error) {
		console.error('Error loading audio file:', error);
		return null;
	}
}