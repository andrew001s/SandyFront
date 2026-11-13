'use client';

import { avatar2dManager } from './avatar2dManager';
import {
	clearSavedLive2dArchive,
	loadSavedLive2dArchive,
	saveLive2dArchive,
} from './live2dStorage';
import { type Live2dPackage, live2dStore } from './live2dStore';
import { unpackLive2dZip } from './live2dZipLoader';

let restorePromise: Promise<Live2dPackage | null> | null = null;
let latestOperation = 0;
let storageQueue = Promise.resolve();

function activatePackage(loadedPackage: Live2dPackage): Live2dPackage {
	live2dStore.setPackage(loadedPackage);
	avatar2dManager.setLive2dModel('loaded', loadedPackage.modelName);
	avatar2dManager.setMode('live2d');
	return loadedPackage;
}

export async function loadLive2dModel(file: File): Promise<Live2dPackage | null> {
	const operation = ++latestOperation;
	const loadedPackage = await unpackLive2dZip(file);
	if (operation !== latestOperation) return null;
	await enqueueStorageOperation(operation, () => saveLive2dArchive(file));
	if (operation !== latestOperation) return null;
	return activatePackage(loadedPackage);
}

export async function restoreSavedLive2dModel(): Promise<Live2dPackage | null> {
	const currentPackage = live2dStore.getPackage();
	if (currentPackage) return currentPackage;
	if (restorePromise) return restorePromise;

	restorePromise = (async () => {
		const operation = latestOperation;
		const savedArchive = await loadSavedLive2dArchive();
		if (!savedArchive) return null;

		const file = new File([savedArchive.blob], savedArchive.name, { type: 'application/zip' });
		const loadedPackage = await unpackLive2dZip(file);
		if (operation !== latestOperation || live2dStore.getPackage()) {
			return live2dStore.getPackage();
		}
		return activatePackage(loadedPackage);
	})();
	try {
		return await restorePromise;
	} finally {
		restorePromise = null;
	}
}

export async function removeLive2dModel(): Promise<void> {
	const operation = ++latestOperation;
	live2dStore.setPackage(null);
	avatar2dManager.setLive2dModel(null);
	await enqueueStorageOperation(operation, clearSavedLive2dArchive);
}

function enqueueStorageOperation(operation: number, action: () => Promise<void>): Promise<void> {
	const queued = storageQueue.then(async () => {
		if (operation !== latestOperation) return;
		try {
			await action();
		} catch (error) {
			console.error('No se pudo actualizar el modelo Live2D persistido:', error);
		}
	});
	storageQueue = queued;
	return queued;
}
