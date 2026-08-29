import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { stopVtsLipSync } from '@/lib/vtsLipSync';

/**
 * Estado local del servicio de VTuber y apagado de todo lo que depende de él.
 *
 * Parar el servicio no es solo dejar de escuchar el chat: hay trabajo ya en
 * vuelo —generación de respuesta, síntesis de voz, audio encolado y la boca del
 * modelo— que seguiría hasta agotarse y gastando peticiones. Aquí se corta todo
 * de una vez.
 */

let controller: AbortController | null = null;
const listeners = new Set<(running: boolean) => void>();
let running = false;

/** Señal que deben pasar la generación de respuesta y la síntesis de voz. */
export function getRuntimeSignal(): AbortSignal {
	if (!controller) {
		controller = new AbortController();
	}
	return controller.signal;
}

export function isServiceRunning(): boolean {
	return running;
}

export function subscribeServiceState(listener: (running: boolean) => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function notify() {
	for (const listener of listeners) {
		listener(running);
	}
}

export function markServiceStarted(): void {
	// Señal nueva: la anterior quedó abortada al parar y no sirve para el arranque.
	controller = new AbortController();
	running = true;
	notify();
}

/**
 * Corta todo lo que estuviera en marcha. Es idempotente: llamarlo dos veces no
 * rompe nada, y se puede invocar aunque el servicio ya estuviera parado.
 */
export function stopServiceRuntime(): void {
	running = false;

	// 1. Aborta lo que esté generándose o sintetizándose.
	controller?.abort();
	controller = null;

	// 2. Vacía la cola de reproducción y detiene el audio en curso.
	AudioQueueManager.getInstance().clearQueue();

	// 3. Cierra la boca del modelo, que si no se queda con el último valor.
	stopVtsLipSync();

	notify();
}
