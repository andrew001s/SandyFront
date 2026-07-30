export type VTSInjectParameters = (params: { id: string; value: number }[]) => Promise<void>;

let activeSession = 0;

const stopMouth = async (injectParameters: VTSInjectParameters) => {
	try {
		await injectParameters([
			{ id: 'SandyLipOpen', value: 0 },
			{ id: 'SandyLipSmile', value: 0 },
		]);
	} catch {
		// Ignore transient plugin errors during cleanup.
	}
};

export const stopVtsLipSync = () => {
	activeSession += 1;
};

export const createVtsLipSyncHandler = (injectParameters: VTSInjectParameters) => {
	return async (audioBlob: Blob) => {
		const session = ++activeSession;
		let audioContext: AudioContext | null = null;

		try {
			const buffer = await audioBlob.arrayBuffer();
			audioContext = new AudioContext();
			if (audioContext.state === 'suspended') {
				await audioContext.resume();
			}

			const audioBuffer = await audioContext.decodeAudioData(buffer);
			const sampleRate = audioBuffer.sampleRate;
			const channel = audioBuffer.getChannelData(0);
			const frameSize = Math.max(1, Math.floor(sampleRate / 60));
			const startTime = performance.now();
			let mouthValue = 0;

			const tick = () => {
				if (session !== activeSession) {
					void stopMouth(injectParameters);
					void audioContext.close();
					return;
				}

				const elapsed = performance.now() - startTime;
				const samplePos = Math.floor((elapsed / 1000) * sampleRate);

				if (samplePos >= channel.length) {
					void stopMouth(injectParameters);
					void audioContext.close();
					return;
				}

				let sumSq = 0;
				let zeroCrossings = 0;
				const start = samplePos;
				const end = Math.min(samplePos + frameSize, channel.length);
				const len = end - start;

				if (len > 0) {
					let prev = channel[start];
					for (let i = start; i < end; i += 1) {
						const sample = channel[i];
						sumSq += sample * sample;
						if (i > start && (sample >= 0) !== (prev >= 0)) {
							zeroCrossings += 1;
						}
						prev = sample;
					}

					const rms = Math.sqrt(sumSq / len);
					const rawVolume = Math.min(rms * 10, 1);
					const target = rawVolume > 0.01 ? Math.max(rawVolume, 0.15) : 0;
					const rawFrequency = Math.min((zeroCrossings / len) * 24, 1);
					mouthValue += (target - mouthValue) * 0.5;

					void injectParameters([
						{ id: 'SandyLipOpen', value: mouthValue },
						{ id: 'SandyLipSmile', value: rawFrequency },
					]).catch(() => {
						// Ignore transient plugin errors while animating lips.
					});
				} else {
					mouthValue *= 0.9;
					void injectParameters([
						{ id: 'SandyLipOpen', value: mouthValue },
						{ id: 'SandyLipSmile', value: 0 },
					]).catch(() => {
						// Ignore transient plugin errors while animating lips.
					});
				}

				requestAnimationFrame(tick);
			};

			requestAnimationFrame(tick);
		} catch {
			await stopMouth(injectParameters);
			if (audioContext) {
				try {
					await audioContext.close();
				} catch {
					// Ignore close errors.
				}
			}
		}
	};
};
