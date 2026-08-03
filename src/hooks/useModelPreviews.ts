'use client';

import type { VTSModel } from '@/hooks/useVTubeStudio';
import {
	clearModelsFolder,
	ensureFolderPermission,
	isFileSystemAccessSupported,
	loadModelsFolder,
	pickModelsFolder,
	resolveModelPreviewUrl,
	revokePreviewUrl,
} from '@/lib/vtsModelPreviews';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type PreviewStatus = 'unsupported' | 'idle' | 'loading' | 'ready';

export function useModelPreviews(models: VTSModel[]) {
	const [status, setStatus] = useState<PreviewStatus>('unsupported');
	const [urls, setUrls] = useState<Record<string, string | null>>({});
	const dirRef = useRef<FileSystemDirectoryHandle | null>(null);
	const urlsRef = useRef<Record<string, string>>({});
	const modelsKeyRef = useRef('');

	const supported = useMemo(() => isFileSystemAccessSupported(), []);
	const modelsKey = useMemo(() => models.map((model) => model.modelID).join('|'), [models]);

	const resolveAll = useCallback(async (dir: FileSystemDirectoryHandle, list: VTSModel[]) => {
		setStatus('loading');
		const next: Record<string, string | null> = {};
		const fresh = { ...urlsRef.current };

		await Promise.all(
			list.map(async (model) => {
				const cached = urlsRef.current[model.modelID];
				if (cached) {
					next[model.modelID] = cached;
					return;
				}
				const url = await resolveModelPreviewUrl(dir, model);
				if (url) fresh[model.modelID] = url;
				next[model.modelID] = url;
			}),
		);

		urlsRef.current = fresh;
		setUrls(next);
		setStatus('ready');
	}, []);

	useEffect(() => {
		if (!supported) {
			setStatus('unsupported');
			return;
		}
		if (models.length === 0) return;
		if (modelsKey === modelsKeyRef.current && dirRef.current) return;

		modelsKeyRef.current = modelsKey;
		let cancelled = false;

		void (async () => {
			const dir = await loadModelsFolder();
			if (cancelled) return;
			if (!dir) {
				setStatus('idle');
				return;
			}
			const granted = await ensureFolderPermission(dir);
			if (cancelled) return;
			if (!granted) {
				dirRef.current = null;
				setStatus('idle');
				return;
			}
			dirRef.current = dir;
			await resolveAll(dir, models);
		})();

		return () => {
			cancelled = true;
		};
	}, [models, modelsKey, resolveAll, supported]);

	const requestAccess = useCallback(async () => {
		if (!supported) return;
		const dir = await pickModelsFolder();
		if (!dir) return;
		dirRef.current = dir;
		await resolveAll(dir, models);
	}, [models, resolveAll, supported]);

	const clearAccess = useCallback(async () => {
		urlsRef.current = {};
		setUrls({});
		modelsKeyRef.current = '';
		dirRef.current = null;
		setStatus('idle');
		await clearModelsFolder();
	}, []);

	useEffect(() => {
		return () => {
			for (const url of Object.values(urlsRef.current)) {
				revokePreviewUrl(url);
			}
			urlsRef.current = {};
		};
	}, []);

	return { status, urls, requestAccess, clearAccess };
}
