'use client';

const DB_NAME = 'sandy_live2d_db';
const STORE_NAME = 'models';
const MODEL_KEY = 'active_live2d_model';

export interface SavedLive2dArchive {
	name: string;
	blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined' || !window.indexedDB) {
			reject(new Error('IndexedDB no está disponible en este entorno.'));
			return;
		}

		const request = window.indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE_NAME)) {
				request.result.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function saveLive2dArchive(file: File): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put({ name: file.name, blob: file }, MODEL_KEY);
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

export async function loadSavedLive2dArchive(): Promise<SavedLive2dArchive | null> {
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const request = tx.objectStore(STORE_NAME).get(MODEL_KEY);
			tx.oncomplete = () => {
				db.close();
				resolve((request.result as SavedLive2dArchive | undefined) ?? null);
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

export async function clearSavedLive2dArchive(): Promise<void> {
	try {
		const db = await openDb();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			tx.objectStore(STORE_NAME).delete(MODEL_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
		db.close();
	} catch {
		// The in-memory model remains usable if persistent storage is unavailable.
	}
}
