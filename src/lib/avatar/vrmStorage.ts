'use client';

const DB_NAME = 'sandy_vrm_db';
const STORE_NAME = 'models';
const MODEL_KEY = 'active_vrm_model';
const META_KEY = 'active_vrm_meta';

export interface VrmModelMeta {
	name: string;
	size: number;
	updatedAt: string;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined' || !window.indexedDB) {
			reject(new Error('IndexedDB no está disponible en este entorno.'));
			return;
		}

		const request = window.indexedDB.open(DB_NAME, 1);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Guarda un archivo .vrm (ArrayBuffer o Blob) en IndexedDB del navegador.
 */
export async function saveVrmModel(buffer: ArrayBuffer, meta: VrmModelMeta): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		store.put(buffer, MODEL_KEY);
		store.put(meta, META_KEY);

		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}

/**
 * Carga el modelo .vrm activo guardado en IndexedDB.
 */
export async function loadSavedVrmModel(): Promise<{
	buffer: ArrayBuffer;
	meta: VrmModelMeta;
} | null> {
	try {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);

			const modelReq = store.get(MODEL_KEY);
			const metaReq = store.get(META_KEY);

			tx.oncomplete = () => {
				db.close();
				if (modelReq.result) {
					resolve({
						buffer: modelReq.result as ArrayBuffer,
						meta: (metaReq.result as VrmModelMeta) || {
							name: 'Mi Avatar VRM',
							size: (modelReq.result as ArrayBuffer).byteLength,
							updatedAt: new Date().toISOString(),
						},
					});
				} else {
					resolve(null);
				}
			};

			tx.onerror = () => {
				db.close();
				reject(tx.error);
			};
		});
	} catch {
		return null;
	}
}

/**
 * Elimina el modelo .vrm guardado.
 */
export async function clearSavedVrmModel(): Promise<void> {
	try {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);

			store.delete(MODEL_KEY);
			store.delete(META_KEY);

			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => {
				db.close();
				reject(tx.error);
			};
		});
	} catch {
		// Ignorar si falla la limpieza
	}
}
