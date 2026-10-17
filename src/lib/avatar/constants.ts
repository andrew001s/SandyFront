import type { AvatarSoftwareConfigs, SoftwareMeta, VRMEmotionPreset } from '@/types/avatar';

export const AVATAR_SOFTWARE_LIST: SoftwareMeta[] = [
	{
		id: 'vtubestudio',
		name: 'VTube Studio',
		shortName: 'VTS',
		dimension: '2d',
		description:
			'Controlador Live2D mediante WebSocket API local. Soporta carga de modelos, expresiones y hotkeys.',
		badge: '2D Live2D',
		defaultPort: 8001,
		features: {
			live2dModels: true,
			vrmBlendshapes: false,
			hotkeys: true,
			expressions: true,
			lipSync: true,
			modelTransform: true,
		},
	},
	{
		id: 'vseeface',
		name: 'VSeeFace',
		shortName: 'VSeeFace',
		dimension: '3d',
		description:
			'Software de alto rendimiento para avatares 3D VRM controlado vía VMC Protocol (OSC / UDP).',
		badge: '3D VRM',
		defaultPort: 39539,
		features: {
			live2dModels: false,
			vrmBlendshapes: true,
			hotkeys: false,
			expressions: true,
			lipSync: true,
			modelTransform: false,
		},
	},
];

export const DEFAULT_SOFTWARE_CONFIGS: AvatarSoftwareConfigs = {
	vtubestudio: {
		port: 8001,
		host: '127.0.0.1',
	},
	vseeface: {
		port: 39539,
		host: '127.0.0.1',
		transitionDurationMs: 120,
	},
};

export const AVATAR_SOFTWARE_STORAGE_KEY = 'sandy_avatar_software';
export const AVATAR_CONFIGS_STORAGE_KEY = 'sandy_avatar_configs';
export const VMC_BRIDGE_PORT = 39542;

/** Presets estándar de expresiones VRM para VSeeFace */
export const VRM_EMOTIONS: VRMEmotionPreset[] = [
	{
		id: 'neutral',
		name: 'Neutral',
		description: 'Rostro relajado y natural por defecto',
		emoji: '😐',
		vrm0Blendshapes: {
			Joy: 0,
			Angry: 0,
			Sorrow: 0,
			Fun: 0,
			Surprised: 0,
		},
		vrm1Blendshapes: {
			happy: 0,
			angry: 0,
			sad: 0,
			relaxed: 0,
			surprised: 0,
		},
	},
	{
		id: 'joy',
		name: 'Alegría / Sonrisa',
		description: 'Expresión feliz y animada',
		emoji: '😄',
		vrm0Blendshapes: {
			Joy: 1.0,
			Fun: 0.5,
			Angry: 0,
			Sorrow: 0,
		},
		vrm1Blendshapes: {
			happy: 1.0,
			relaxed: 0.5,
			angry: 0,
			sad: 0,
		},
	},
	{
		id: 'angry',
		name: 'Enojada',
		description: 'Ceño fruncido y mirada desafiante',
		emoji: '😠',
		vrm0Blendshapes: {
			Angry: 1.0,
			Joy: 0,
			Sorrow: 0,
		},
		vrm1Blendshapes: {
			angry: 1.0,
			happy: 0,
			sad: 0,
		},
	},
	{
		id: 'sorrow',
		name: 'Tristeza',
		description: 'Mirada caída y melancólica',
		emoji: '😢',
		vrm0Blendshapes: {
			Sorrow: 1.0,
			Joy: 0,
			Angry: 0,
		},
		vrm1Blendshapes: {
			sad: 1.0,
			happy: 0,
			angry: 0,
		},
	},
	{
		id: 'fun',
		name: 'Divertida',
		description: 'Sonrisa pícara y animada',
		emoji: '😆',
		vrm0Blendshapes: {
			Fun: 1.0,
			Joy: 0.6,
		},
		vrm1Blendshapes: {
			relaxed: 1.0,
			happy: 0.6,
		},
	},
	{
		id: 'surprised',
		name: 'Sorpresa',
		description: 'Ojos bien abiertos y asombro',
		emoji: '😲',
		vrm0Blendshapes: {
			Surprised: 1.0,
		},
		vrm1Blendshapes: {
			surprised: 1.0,
		},
	},
	{
		id: 'blink',
		name: 'Parpadeo / Guiño',
		description: 'Ojos cerrados o guiño suave',
		emoji: '😉',
		vrm0Blendshapes: {
			Blink: 1.0,
		},
		vrm1Blendshapes: {
			blink: 1.0,
		},
	},
];
