import { AudioQueueManager } from '@/lib/audioQueueSingleton';

/**
 * Codifica muestras PCM flotantes (-1.0 a +1.0) en un Blob estándar WAV de 16 bits.
 */
export function createWavBlob(samples: Float32Array, sampleRate = 24000): Blob {
	const buffer = new ArrayBuffer(44 + samples.length * 2);
	const view = new DataView(buffer);

	const writeString = (offset: number, str: string) => {
		for (let i = 0; i < str.length; i += 1) {
			view.setUint8(offset + i, str.charCodeAt(i));
		}
	};

	writeString(0, 'RIFF');
	view.setUint32(4, 36 + samples.length * 2, true);
	writeString(8, 'WAVE');
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true); // Tamaño chunk fmt (16 para PCM)
	view.setUint16(20, 1, true); // Formato audio (1 = PCM)
	view.setUint16(22, 1, true); // Canales (1 = Mono)
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true); // Byte rate (SampleRate * Canales * BitsPerSample / 8)
	view.setUint16(32, 2, true); // Block align (Canales * BitsPerSample / 8)
	view.setUint16(34, 16, true); // Bits por muestra (16 bits)
	writeString(36, 'data');
	view.setUint32(40, samples.length * 2, true);

	let offset = 44;
	for (let i = 0; i < samples.length; i += 1) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		offset += 2;
	}

	return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Genera un archivo de audio WAV de prueba con las 5 vocales estándar: A, E, I, O, U.
 * Cada vocal posee sus formantes acústicos exactos (F1 y F2) y pausas de silencio
 * para verificar apertura, forma de labios y cierre en tiempo real.
 */
export function generateVowelTestWav(): Blob {
	const sampleRate = 24000;
	const vowels = [
		{ name: 'A', f1: 850, f2: 1250 },
		{ name: 'E', f1: 520, f2: 2000 },
		{ name: 'I', f1: 320, f2: 2400 },
		{ name: 'O', f1: 520, f2: 950 },
		{ name: 'U', f1: 320, f2: 850 },
	];

	const vowelDuration = 0.65; // Duración de cada vocal
	const pauseDuration = 0.28; // Pausa de silencio entre vocales para cierre de boca
	const totalTime = vowels.length * (vowelDuration + pauseDuration);
	const totalSamples = Math.floor(totalTime * sampleRate);
	const samples = new Float32Array(totalSamples);

	let sampleOffset = 0;
	for (const v of vowels) {
		const numSamples = Math.floor(vowelDuration * sampleRate);
		for (let i = 0; i < numSamples; i += 1) {
			const t = i / sampleRate;

			// Envolvente de volumen (ataque suave de 40ms y caída de 50ms)
			let env = 1.0;
			if (t < 0.04) {
				env = t / 0.04;
			} else if (t > vowelDuration - 0.05) {
				env = (vowelDuration - t) / 0.05;
			}

			// Tono fundamental femenino Sandy (190 Hz) con sutil vibrato (5 Hz)
			const f0 = 190 + Math.sin(2 * Math.PI * 5 * t) * 3;

			// Armónicos glotales y resonancias formánticas F1 y F2
			const glottal0 = Math.sin(2 * Math.PI * f0 * t) * 0.32;
			const glottal1 = Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.18;
			const formant1 = Math.sin(2 * Math.PI * v.f1 * t) * 0.35;
			const formant2 = Math.sin(2 * Math.PI * v.f2 * t) * 0.24;

			samples[sampleOffset + i] = (glottal0 + glottal1 + formant1 + formant2) * env * 0.72;
		}
		sampleOffset += numSamples + Math.floor(pauseDuration * sampleRate);
	}

	return createWavBlob(samples, sampleRate);
}

/**
 * Genera un flujo de audio sintético fluido con modulación prosódica de habla humana,
 * ideal para pruebas instantáneas sin depender de internet ni APIs externas.
 */
export function generateSpeechSentenceWav(phrase?: string): Blob {
	const sampleRate = 24000;
	const text = phrase?.trim() ? phrase : 'Hola Sandy sincronizando labios';

	// Extraer sílabas aproximadas según vocales
	const syllables: Array<{ f1: number; f2: number; pitch: number }> = [];
	const basePitch = 195;

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i].toLowerCase();
		let f1 = 600;
		let f2 = 1500;
		let pitchOffset = 0;

		switch (char) {
			case 'a':
			case 'á':
				f1 = 850;
				f2 = 1250;
				pitchOffset = 5;
				break;
			case 'e':
			case 'é':
				f1 = 520;
				f2 = 2000;
				pitchOffset = 10;
				break;
			case 'i':
			case 'í':
				f1 = 320;
				f2 = 2400;
				pitchOffset = 18;
				break;
			case 'o':
			case 'ó':
				f1 = 520;
				f2 = 950;
				pitchOffset = -8;
				break;
			case 'u':
			case 'ú':
				f1 = 320;
				f2 = 850;
				pitchOffset = -15;
				break;
			case ' ':
				// Silencio corto
				syllables.push({ f1: 0, f2: 0, pitch: 0 });
				continue;
			default:
				// Consonantes intermedias
				f1 = 450;
				f2 = 1600;
				pitchOffset = 0;
				break;
		}

		syllables.push({
			f1,
			f2,
			pitch: basePitch + pitchOffset,
		});
	}

	const charDuration = 0.11; // 110ms por fonema
	const totalTime = Math.max(1.0, syllables.length * charDuration + 0.3);
	const totalSamples = Math.floor(totalTime * sampleRate);
	const samples = new Float32Array(totalSamples);

	for (let idx = 0; idx < syllables.length; idx += 1) {
		const syl = syllables[idx];
		const startSample = Math.floor(idx * charDuration * sampleRate);
		const numSamples = Math.floor(charDuration * sampleRate);

		if (syl.pitch === 0) {
			// Espacio / pausa
			continue;
		}

		for (let i = 0; i < numSamples; i += 1) {
			const pos = startSample + i;
			if (pos >= totalSamples) break;

			const t = i / sampleRate;
			let env = 1.0;
			if (t < 0.02) env = t / 0.02;
			else if (t > charDuration - 0.02) env = (charDuration - t) / 0.02;

			const f0 = syl.pitch + Math.sin(2 * Math.PI * 4 * (pos / sampleRate)) * 4;
			const wave =
				Math.sin(2 * Math.PI * f0 * t) * 0.3 +
				Math.sin(2 * Math.PI * syl.f1 * t) * 0.35 +
				Math.sin(2 * Math.PI * syl.f2 * t) * 0.25;

			samples[pos] = wave * env * 0.7;
		}
	}

	return createWavBlob(samples, sampleRate);
}

/**
 * Encola un audio en AudioQueueManager para ejecutar el pipeline real de lip-sync.
 */
export async function playLipSyncTest(audioBlob: Blob): Promise<void> {
	await AudioQueueManager.getInstance().addToQueue(audioBlob);
}

/**
 * Detiene la reproducción de prueba y devuelve la boca del avatar a reposo.
 */
export function stopLipSyncTest(): void {
	AudioQueueManager.getInstance().clearQueue();
}
