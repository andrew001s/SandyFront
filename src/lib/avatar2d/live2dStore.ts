'use client';

export interface Live2dPackage {
	// biome-ignore lint/suspicious/noExplicitAny: Raw Cubism model settings JSON
	modelSettingsJson: any;
	fileMap: Record<string, string>;
	modelName: string;
	blobUrls: string[];
}

class Live2dStore {
	private static instance: Live2dStore;
	private currentPkg: Live2dPackage | null = null;
	private listeners = new Set<(pkg: Live2dPackage | null) => void>();

	public static getInstance(): Live2dStore {
		if (!Live2dStore.instance) {
			Live2dStore.instance = new Live2dStore();
		}
		return Live2dStore.instance;
	}

	public setPackage(pkg: Live2dPackage | null): void {
		if (this.currentPkg && this.currentPkg !== pkg) {
			for (const url of this.currentPkg.blobUrls) {
				URL.revokeObjectURL(url);
			}
		}
		this.currentPkg = pkg;
		for (const listener of this.listeners) {
			listener(this.currentPkg);
		}
	}

	public getPackage(): Live2dPackage | null {
		return this.currentPkg;
	}

	public subscribe(listener: (pkg: Live2dPackage | null) => void): () => void {
		this.listeners.add(listener);
		listener(this.currentPkg);
		return () => this.listeners.delete(listener);
	}
}

export const live2dStore = Live2dStore.getInstance();
