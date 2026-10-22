'use client';

import {
	type VrmModelMeta,
	clearSavedVrmModel,
	loadSavedVrmModel,
	saveVrmModel,
} from '@/lib/avatar/vrmStorage';
import type { VrmViewer } from '@/lib/avatar/vrmViewer';

export type VrmSyncMessage =
	| { type: 'vowels'; vowels: { A?: number; I?: number; U?: number; E?: number; O?: number } }
	| { type: 'emotion'; emotion: string; intensity: number }
	| { type: 'reset' }
	| { type: 'modelUpdated' };

export class VrmManager {
	private static instance: VrmManager;
	private activeViewers = new Set<VrmViewer>();
	private broadcastChannel: BroadcastChannel | null = null;
	private currentMeta: VrmModelMeta | null = null;
	private currentBuffer: ArrayBuffer | null = null;
	private listeners = new Set<() => void>();

	private constructor() {
		if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
			this.broadcastChannel = new BroadcastChannel('sandy_vrm_sync');
			this.broadcastChannel.onmessage = (event: MessageEvent<VrmSyncMessage>) => {
				this.handleSyncMessage(event.data);
			};
		}
	}

	static getInstance(): VrmManager {
		if (!VrmManager.instance) {
			VrmManager.instance = new VrmManager();
		}
		return VrmManager.instance;
	}

	public subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}

	public registerViewer(viewer: VrmViewer): () => void {
		this.activeViewers.add(viewer);
		if (this.currentBuffer) {
			void viewer.loadModel(this.currentBuffer.slice(0));
		} else {
			// Intentar cargar de IndexedDB
			void this.restoreSavedModel().then((loaded) => {
				if (loaded && this.currentBuffer) {
					void viewer.loadModel(this.currentBuffer.slice(0));
				}
			});
		}

		return () => {
			this.activeViewers.delete(viewer);
		};
	}

	public async restoreSavedModel(): Promise<boolean> {
		if (this.currentBuffer) return true;
		const saved = await loadSavedVrmModel();
		if (saved) {
			this.currentBuffer = saved.buffer;
			this.currentMeta = saved.meta;
			this.notify();
			return true;
		}
		return false;
	}

	public getMeta(): VrmModelMeta | null {
		return this.currentMeta;
	}

	public async loadModelFile(file: File): Promise<void> {
		const buffer = await file.arrayBuffer();
		const meta: VrmModelMeta = {
			name: file.name.replace(/\.vrm$/i, ''),
			size: file.size,
			updatedAt: new Date().toISOString(),
		};

		this.currentBuffer = buffer;
		this.currentMeta = meta;

		// Guardar en IndexedDB
		await saveVrmModel(buffer.slice(0), meta);

		// Cargar en los viewers activos
		for (const viewer of this.activeViewers) {
			await viewer.loadModel(buffer.slice(0));
		}

		// Notificar a otras pestañas (como overlay OBS)
		this.broadcastChannel?.postMessage({ type: 'modelUpdated' });
		this.notify();
	}

	public async removeModel(): Promise<void> {
		this.currentBuffer = null;
		this.currentMeta = null;
		await clearSavedVrmModel();
		this.notify();
		this.broadcastChannel?.postMessage({ type: 'modelUpdated' });
	}

	public setVowels(vowels: { A?: number; I?: number; U?: number; E?: number; O?: number }): void {
		for (const viewer of this.activeViewers) {
			viewer.setVowels(vowels);
		}
		this.broadcastChannel?.postMessage({ type: 'vowels', vowels });
	}

	public setEmotion(emotion: string, intensity = 1.0): void {
		for (const viewer of this.activeViewers) {
			viewer.setExpression(emotion, intensity);
		}
		this.broadcastChannel?.postMessage({ type: 'emotion', emotion, intensity });
	}

	public resetEmotions(): void {
		for (const viewer of this.activeViewers) {
			viewer.resetExpressions();
		}
		this.broadcastChannel?.postMessage({ type: 'reset' });
	}

	private handleSyncMessage(msg: VrmSyncMessage): void {
		switch (msg.type) {
			case 'vowels':
				for (const viewer of this.activeViewers) {
					viewer.setVowels(msg.vowels);
				}
				break;
			case 'emotion':
				for (const viewer of this.activeViewers) {
					viewer.setExpression(msg.emotion, msg.intensity);
				}
				break;
			case 'reset':
				for (const viewer of this.activeViewers) {
					viewer.resetExpressions();
				}
				break;
			case 'modelUpdated':
				void this.restoreSavedModel().then(() => {
					if (this.currentBuffer) {
						for (const viewer of this.activeViewers) {
							void viewer.loadModel(this.currentBuffer.slice(0));
						}
					}
				});
				break;
		}
	}
}

export const vrmManager = VrmManager.getInstance();
