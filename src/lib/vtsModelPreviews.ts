'use client';

import type { VTSModel } from '@/hooks/useVTubeStudio';

const DB_NAME = 'sandy-vts-previews';
const DB_VERSION = 1;
const DB_STORE = 'folder';
const DB_KEY = 'models-folder';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(DB_STORE)) {
				db.createObjectStore(DB_STORE);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	return dbPromise;
}

export function isFileSystemAccessSupported(): boolean {
	return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export async function ensureFolderPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
	try {
		if (typeof handle.queryPermission !== 'function') return true;
		let state = await handle.queryPermission({ mode: 'read' });
		if (state === 'prompt' && typeof handle.requestPermission === 'function') {
			state = await handle.requestPermission({ mode: 'read' });
		}
		return state === 'granted';
	} catch {
		return false;
	}
}

export async function saveModelsFolder(handle: FileSystemDirectoryHandle): Promise<void> {
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(DB_STORE, 'readwrite');
		tx.objectStore(DB_STORE).put(handle, DB_KEY);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function loadModelsFolder(): Promise<FileSystemDirectoryHandle | null> {
	try {
		const db = await openDb();
		return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
			const tx = db.transaction(DB_STORE, 'readonly');
			const req = tx.objectStore(DB_STORE).get(DB_KEY);
			req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
			req.onerror = () => reject(req.error);
		});
	} catch {
		return null;
	}
}

export async function clearModelsFolder(): Promise<void> {
	try {
		const db = await openDb();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(DB_STORE, 'readwrite');
			tx.objectStore(DB_STORE).delete(DB_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch {
		// The folder handle may no longer be valid; nothing to clean up.
	}
}

export async function pickModelsFolder(): Promise<FileSystemDirectoryHandle | null> {
	if (!isFileSystemAccessSupported()) return null;
	try {
		const handle = await window.showDirectoryPicker({
			id: 'sandy-vts-models',
			mode: 'read',
		});
		await saveModelsFolder(handle);
		return handle;
	} catch {
		// The user cancelled the picker.
		return null;
	}
}

async function findFile(
	dir: FileSystemDirectoryHandle,
	fileName: string,
): Promise<FileSystemFileHandle | null> {
	try {
		const handle = await dir.getFileHandle(fileName, { create: false });
		return handle;
	} catch {
		return null;
	}
}

async function findVtubeJson(dir: FileSystemDirectoryHandle): Promise<FileSystemFileHandle | null> {
	for await (const [, handle] of dir.entries()) {
		if (handle.kind !== 'file') continue;
		if (handle.name.toLowerCase().endsWith('.vtube.json')) return handle as FileSystemFileHandle;
	}
	return null;
}

async function listImageFiles(dir: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[]> {
	const images: FileSystemFileHandle[] = [];
	for await (const [, handle] of dir.entries()) {
		if (handle.kind !== 'file') continue;
		const name = handle.name.toLowerCase();
		if (IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
			images.push(handle as FileSystemFileHandle);
		}
	}
	return images;
}

async function matchesModelId(file: File, modelID: string): Promise<boolean> {
	try {
		const parsed = JSON.parse(await file.text()) as { modelID?: string };
		return parsed.modelID === modelID;
	} catch {
		return false;
	}
}

async function findModelFolder(
	modelsDir: FileSystemDirectoryHandle,
	model: VTSModel,
): Promise<FileSystemDirectoryHandle | null> {
	if (model.vtsModelName) {
		for await (const [, handle] of modelsDir.entries()) {
			if (handle.kind !== 'directory') continue;
			const dir = handle as FileSystemDirectoryHandle;
			const match = await findFile(dir, model.vtsModelName);
			if (match) return dir;
		}
	}

	for await (const [, handle] of modelsDir.entries()) {
		if (handle.kind !== 'directory') continue;
		const dir = handle as FileSystemDirectoryHandle;
		const vtubeFile = await findVtubeJson(dir);
		if (!vtubeFile) continue;
		try {
			const file = await vtubeFile.getFile();
			if (await matchesModelId(file, model.modelID)) return dir;
		} catch {
			// Unreadable model config; keep looking.
		}
	}
	return null;
}

export async function resolveModelPreviewUrl(
	modelsDir: FileSystemDirectoryHandle,
	model: VTSModel,
): Promise<string | null> {
	const folder = await findModelFolder(modelsDir, model);
	if (!folder) return null;

	let icon: FileSystemFileHandle | null = null;
	if (model.vtsModelIconName) {
		icon = await findFile(folder, model.vtsModelIconName);
	}
	if (!icon) {
		const images = await listImageFiles(folder);
		icon = images[0] ?? null;
	}
	if (!icon) return null;

	try {
		const file = await icon.getFile();
		return URL.createObjectURL(file);
	} catch {
		return null;
	}
}

export function revokePreviewUrl(url: string | null): void {
	if (url) URL.revokeObjectURL(url);
}
