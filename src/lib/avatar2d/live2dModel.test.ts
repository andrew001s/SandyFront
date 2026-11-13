import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avatar2dManager } from './avatar2dManager';
import {
	clearSavedLive2dArchive,
	loadSavedLive2dArchive,
	saveLive2dArchive,
} from './live2dStorage';
import { type Live2dPackage, live2dStore } from './live2dStore';

const { unpackLive2dZip } = vi.hoisted(() => ({ unpackLive2dZip: vi.fn() }));

vi.mock('./live2dZipLoader', () => ({ unpackLive2dZip }));
vi.mock('./live2dStorage', () => ({
	clearSavedLive2dArchive: vi.fn(async () => undefined),
	loadSavedLive2dArchive: vi.fn(async () => null),
	saveLive2dArchive: vi.fn(async () => undefined),
}));

const loadedPackage: Live2dPackage = {
	modelSettingsJson: { FileReferences: { Expressions: [] } },
	fileMap: {},
	modelName: 'Hiyori',
	blobUrls: [],
};

describe('live2dModel', () => {
	beforeEach(() => {
		live2dStore.setPackage(null);
		avatar2dManager.setLive2dModel(null, undefined, false);
		vi.mocked(unpackLive2dZip).mockResolvedValue(loadedPackage);
		vi.mocked(saveLive2dArchive).mockResolvedValue(undefined);
		vi.mocked(loadSavedLive2dArchive).mockResolvedValue(null);
		vi.mocked(clearSavedLive2dArchive).mockResolvedValue(undefined);
	});

	afterEach(() => {
		live2dStore.setPackage(null);
	});

	it('persists the uploaded ZIP and activates the unpacked package', async () => {
		const { loadLive2dModel } = await import('./live2dModel');
		const file = new File(['archive'], 'hiyori.zip', { type: 'application/zip' });

		await loadLive2dModel(file);

		expect(saveLive2dArchive).toHaveBeenCalledWith(file);
		expect(live2dStore.getPackage()).toBe(loadedPackage);
		expect(avatar2dManager.getState().live2d.modelName).toBe('Hiyori');
		expect(avatar2dManager.getState().mode).toBe('live2d');
	});

	it('rebuilds the package from the saved ZIP after a reload', async () => {
		const archive = { name: 'hiyori.zip', blob: new Blob(['archive']) };
		vi.mocked(loadSavedLive2dArchive).mockResolvedValue(archive);
		const { restoreSavedLive2dModel } = await import('./live2dModel');

		await restoreSavedLive2dModel();

		expect(unpackLive2dZip).toHaveBeenCalledWith(expect.objectContaining({ name: 'hiyori.zip' }));
		expect(live2dStore.getPackage()).toBe(loadedPackage);
		expect(avatar2dManager.getState().live2d.modelName).toBe('Hiyori');
	});

	it('removes the saved archive when the model is removed', async () => {
		const { removeLive2dModel } = await import('./live2dModel');
		live2dStore.setPackage(loadedPackage);
		avatar2dManager.setLive2dModel('loaded', 'Hiyori', false);

		await removeLive2dModel();

		expect(live2dStore.getPackage()).toBeNull();
		expect(avatar2dManager.getState().live2d.modelUrl).toBeNull();
		expect(clearSavedLive2dArchive).toHaveBeenCalledOnce();
	});

	it('does not reactivate a restored model when removal happens during restore', async () => {
		vi.mocked(loadSavedLive2dArchive).mockResolvedValue({
			name: 'hiyori.zip',
			blob: new Blob(['archive']),
		});
		let finishUnpack!: (value: Live2dPackage) => void;
		vi.mocked(unpackLive2dZip).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finishUnpack = resolve;
				}),
		);
		const { restoreSavedLive2dModel, removeLive2dModel } = await import('./live2dModel');
		const restoring = restoreSavedLive2dModel();
		await vi.waitFor(() => expect(unpackLive2dZip).toHaveBeenCalled());

		await removeLive2dModel();
		finishUnpack(loadedPackage);
		await restoring;

		expect(live2dStore.getPackage()).toBeNull();
		expect(avatar2dManager.getState().live2d.modelUrl).toBeNull();
	});

	it('keeps a newer upload when an older restore finishes later', async () => {
		const newPackage = { ...loadedPackage, modelName: 'New model' };
		vi.mocked(loadSavedLive2dArchive).mockResolvedValue({
			name: 'old.zip',
			blob: new Blob(['archive']),
		});
		let finishRestore!: (value: Live2dPackage) => void;
		vi.mocked(unpackLive2dZip)
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishRestore = resolve;
					}),
			)
			.mockResolvedValueOnce(newPackage);
		const { restoreSavedLive2dModel, loadLive2dModel } = await import('./live2dModel');
		const restoring = restoreSavedLive2dModel();
		await vi.waitFor(() => expect(unpackLive2dZip).toHaveBeenCalled());

		await loadLive2dModel(new File(['new'], 'new.zip', { type: 'application/zip' }));
		finishRestore(loadedPackage);
		await restoring;

		expect(live2dStore.getPackage()).toBe(newPackage);
		expect(avatar2dManager.getState().live2d.modelName).toBe('New model');
	});

	it('does not activate an upload that finishes after the model is removed', async () => {
		let finishUnpack!: (value: Live2dPackage) => void;
		vi.mocked(unpackLive2dZip).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finishUnpack = resolve;
				}),
		);
		const { loadLive2dModel, removeLive2dModel } = await import('./live2dModel');
		const loading = loadLive2dModel(
			new File(['archive'], 'hiyori.zip', { type: 'application/zip' }),
		);
		await vi.waitFor(() => expect(unpackLive2dZip).toHaveBeenCalled());

		await removeLive2dModel();
		finishUnpack(loadedPackage);

		expect(await loading).toBeNull();
		expect(live2dStore.getPackage()).toBeNull();
	});
});
