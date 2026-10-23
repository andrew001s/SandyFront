'use client';

export type VrmBackgroundMode = 'preset' | 'color' | 'image';

export type VrmBackgroundPresetId =
	| 'studio'
	| 'chroma-green'
	| 'chroma-blue'
	| 'chroma-magenta'
	| 'checker'
	| 'cyber'
	| 'black'
	| 'white';

export interface VrmBackgroundPreset {
	id: VrmBackgroundPresetId;
	label: string;
	description: string;
	styleClass?: string;
	backgroundColor?: string;
	swatchStyle: React.CSSProperties;
}

export const VRM_BACKGROUND_PRESETS: VrmBackgroundPreset[] = [
	{
		id: 'studio',
		label: 'Estudio Oscuro',
		description: 'Degradado radial profesional slate/zinc ideal para streaming',
		styleClass:
			'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black',
		swatchStyle: {
			background: 'radial-gradient(circle at 30% 30%, #1e293b, #09090b)',
		},
	},
	{
		id: 'chroma-green',
		label: 'Croma Verde',
		description: 'Pantalla verde pura (#00FF00) para recortar con filtro Croma en OBS',
		backgroundColor: '#00FF00',
		swatchStyle: {
			backgroundColor: '#00FF00',
		},
	},
	{
		id: 'chroma-blue',
		label: 'Croma Azul',
		description: 'Pantalla azul pura (#0000FF) para modelos con pelo o ropa verde',
		backgroundColor: '#0000FF',
		swatchStyle: {
			backgroundColor: '#0000FF',
		},
	},
	{
		id: 'chroma-magenta',
		label: 'Croma Magenta',
		description: 'Pantalla magenta (#FF00FF) de alto contraste para recorte OBS',
		backgroundColor: '#FF00FF',
		swatchStyle: {
			backgroundColor: '#FF00FF',
		},
	},
	{
		id: 'checker',
		label: 'Transparente (PNG)',
		description: 'Cuadrícula de transparencia para verificar silueta del avatar',
		styleClass: 'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:24px_24px]',
		swatchStyle: {
			background: 'repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 0 0 / 12px 12px',
		},
	},
	{
		id: 'cyber',
		label: 'Cíber Neón',
		description: 'Atmósfera oscura profunda con matices cian/morado',
		styleClass:
			'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-indigo-950/30 to-black',
		swatchStyle: {
			background: 'radial-gradient(circle, #0e7490 0%, #1e1b4b 50%, #000000 100%)',
		},
	},
	{
		id: 'black',
		label: 'Negro Puro',
		description: 'Fondo negro total (#000000) de máximo contraste',
		backgroundColor: '#000000',
		swatchStyle: {
			backgroundColor: '#000000',
		},
	},
	{
		id: 'white',
		label: 'Blanco Estudio',
		description: 'Fondo claro para inspección de sombras e iluminación',
		backgroundColor: '#f8fafc',
		swatchStyle: {
			backgroundColor: '#f8fafc',
		},
	},
];

export interface VrmBackgroundState {
	mode: VrmBackgroundMode;
	presetId: VrmBackgroundPresetId;
	customColor: string;
	imageUrl: string | null;
	imageName?: string;
	imageFit: 'cover' | 'contain';
	imageDim: number; // 0 a 0.8
	imageBlur: number; // 0 a 16 px
}

export const DEFAULT_VRM_BACKGROUND_STATE: VrmBackgroundState = {
	mode: 'preset',
	presetId: 'studio',
	customColor: '#18181b',
	imageUrl: null,
	imageName: undefined,
	imageFit: 'cover',
	imageDim: 0,
	imageBlur: 0,
};

const STORAGE_KEY = 'sandy_vrm_background_state';
const IMAGE_STORAGE_KEY = 'sandy_vrm_background_image_data';

export function getStoredBackgroundState(): VrmBackgroundState {
	if (typeof window === 'undefined') return DEFAULT_VRM_BACKGROUND_STATE;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_VRM_BACKGROUND_STATE;
		const parsed = JSON.parse(raw) as Partial<VrmBackgroundState>;

		// Restaurar imagen guardada si existe
		let storedImage: string | null = null;
		try {
			storedImage = window.localStorage.getItem(IMAGE_STORAGE_KEY);
		} catch {
			// Ignorar si no se puede leer
		}

		return {
			...DEFAULT_VRM_BACKGROUND_STATE,
			...parsed,
			imageUrl: storedImage || parsed.imageUrl || null,
		};
	} catch {
		return DEFAULT_VRM_BACKGROUND_STATE;
	}
}

export function storeBackgroundState(state: VrmBackgroundState): void {
	if (typeof window === 'undefined') return;
	try {
		const { imageUrl, ...rest } = state;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));

		if (imageUrl?.startsWith('data:')) {
			try {
				window.localStorage.setItem(IMAGE_STORAGE_KEY, imageUrl);
			} catch {
				// LocalStorage quota may be exceeded for large images
			}
		} else if (!imageUrl) {
			window.localStorage.removeItem(IMAGE_STORAGE_KEY);
		}
	} catch {
		// Ignorar errores de quota de almacenamiento
	}
}

export async function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
		reader.readAsDataURL(file);
	});
}
