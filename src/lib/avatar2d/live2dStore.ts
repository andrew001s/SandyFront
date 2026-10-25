/** Resources unpacked from an uploaded Live2D model archive. */
export interface Live2dPackage {
	modelSettingsJson: {
		[key: string]: unknown;
		FileReferences?: {
			[key: string]: unknown;
			Expressions?: unknown[];
		};
	};
	fileMap: Record<string, string>;
	modelName: string;
	blobUrls: string[];
}

type Listener = (value: Live2dPackage | null) => void;

let currentPackage: Live2dPackage | null = null;
const listeners = new Set<Listener>();

export const live2dStore = {
	getPackage(): Live2dPackage | null {
		return currentPackage;
	},

	setPackage(value: Live2dPackage | null): void {
		if (value === currentPackage) return;

		const previous = currentPackage;
		currentPackage = value;

		// ZIP resources are held in object URLs for the lifetime of the package.
		if (previous) {
			for (const url of previous.blobUrls) {
				if (typeof URL !== 'undefined' && url.startsWith('blob:')) {
					URL.revokeObjectURL(url);
				}
			}
		}

		for (const listener of listeners) listener(currentPackage);
	},

	subscribe(listener: Listener): () => void {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
};
