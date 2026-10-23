import JSZip from 'jszip';
import type { Live2dPackage } from './live2dStore';

/**
 * Desempaqueta un archivo ZIP que contiene un modelo Live2D (Cubism 3/4)
 * y construye un mapa completo de recursos virtuales en memoria (Blob URLs).
 * Esto permite alimentar directamente ModelSettings sin depender de las restricciones
 * de FileLoader o rutas relativas del navegador.
 */
export async function unpackLive2dZip(file: File): Promise<Live2dPackage> {
	const zip = await JSZip.loadAsync(file);
	const fileMap: Record<string, string> = {};
	const blobUrls: string[] = [];

	let model3Path: string | null = null;
	let modelName = file.name.replace(/\.[^/.]+$/, '');

	// 1. Encontrar el archivo principal .model3.json o .model.json
	for (const rawPath of Object.keys(zip.files)) {
		const lower = rawPath.toLowerCase();
		if (
			(lower.endsWith('.model3.json') || lower.endsWith('.model.json')) &&
			!lower.includes('__macosx') &&
			!lower.includes('pinned_to_model') &&
			!zip.files[rawPath].dir
		) {
			model3Path = rawPath;
			break;
		}
	}

	if (!model3Path) {
		throw new Error(
			'No se encontró ningún archivo de definición (.model3.json o .model.json) dentro del ZIP.',
		);
	}

	// 2. Crear Blob URLs para todos los archivos del ZIP
	for (const [rawPath, entry] of Object.entries(zip.files)) {
		if (entry.dir || rawPath.includes('__MACOSX')) continue;

		const normPath = rawPath.replace(/\\/g, '/').replace(/^\.?\//, '');
		const fileName = normPath.split('/').pop() || 'file';

		// Inferir tipo mime para texturas y datos
		let mimeType = 'application/octet-stream';
		const lower = fileName.toLowerCase();
		if (lower.endsWith('.png')) mimeType = 'image/png';
		else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mimeType = 'image/jpeg';
		else if (lower.endsWith('.json')) mimeType = 'application/json';

		const blob = await entry.async('blob');
		const typedBlob = new Blob([blob], { type: mimeType });
		const url = URL.createObjectURL(typedBlob);
		blobUrls.push(url);

		// Registrar bajo múltiples claves para garantizar que cualquier resolución funcione
		fileMap[normPath] = url;
		fileMap[fileName] = url;

		// Si model3Path tiene una carpeta base, registrar también la ruta relativa a esa base
		if (model3Path.includes('/')) {
			const baseDir = model3Path.substring(0, model3Path.lastIndexOf('/') + 1);
			if (normPath.startsWith(baseDir)) {
				const relFromBase = normPath.substring(baseDir.length);
				fileMap[relFromBase] = url;
			}
		}
	}

	// 3. Leer y parsear el archivo .model3.json
	const rawJson = await zip.files[model3Path].async('string');
	const modelSettingsJson = JSON.parse(rawJson);
	modelSettingsJson.url = model3Path;

	const mainFileName = model3Path.split('/').pop() || '';
	if (mainFileName) {
		modelName = mainFileName.replace(/\.model3?\.json$/i, '');
	}

	return {
		modelSettingsJson,
		fileMap,
		modelName,
		blobUrls,
	};
}
