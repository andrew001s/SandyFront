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
			Blink: 0,
			Blink_L: 0,
			Blink_R: 0,
		},
		vrm1Blendshapes: {
			happy: 0,
			angry: 0,
			sad: 0,
			relaxed: 0,
			surprised: 0,
			blink: 0,
			blinkLeft: 0,
			blinkRight: 0,
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
		},
		vrm1Blendshapes: {
			happy: 1.0,
			relaxed: 0.5,
		},
	},
	{
		id: 'excited',
		name: 'Emocionada',
		description: 'Entusiasmo radiante y gran felicidad',
		emoji: '🤩',
		vrm0Blendshapes: {
			Joy: 1.0,
			Fun: 0.9,
			Surprised: 0.25,
		},
		vrm1Blendshapes: {
			happy: 1.0,
			relaxed: 0.9,
			surprised: 0.25,
		},
	},
	{
		id: 'angry',
		name: 'Enojada',
		description: 'Ceño fruncido y mirada desafiante',
		emoji: '😠',
		vrm0Blendshapes: {
			Angry: 1.0,
		},
		vrm1Blendshapes: {
			angry: 1.0,
		},
	},
	{
		id: 'sorrow',
		name: 'Tristeza',
		description: 'Mirada caída y melancólica',
		emoji: '😢',
		vrm0Blendshapes: {
			Sorrow: 1.0,
		},
		vrm1Blendshapes: {
			sad: 1.0,
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
		id: 'thinking',
		name: 'Pensativa',
		description: 'Mirada hacia arriba reflexionando',
		emoji: '🤔',
		vrm0Blendshapes: {
			LookUp: 0.7,
			Fun: 0.3,
			Joy: 0.2,
		},
		vrm1Blendshapes: {
			lookUp: 0.7,
			relaxed: 0.3,
			happy: 0.2,
		},
	},
	{
		id: 'confused',
		name: 'Confundida',
		description: 'Gesto de duda o desconcierto',
		emoji: '😕',
		vrm0Blendshapes: {
			Sorrow: 0.45,
			Surprised: 0.35,
			Angry: 0.2,
		},
		vrm1Blendshapes: {
			sad: 0.45,
			surprised: 0.35,
			angry: 0.2,
		},
	},
	{
		id: 'shy',
		name: 'Tímida',
		description: 'Sonrisa suave y mirada recatada',
		emoji: '😳',
		vrm0Blendshapes: {
			Joy: 0.6,
			Sorrow: 0.3,
			LookDown: 0.4,
		},
		vrm1Blendshapes: {
			happy: 0.6,
			sad: 0.3,
			lookDown: 0.4,
		},
	},
	{
		id: 'sleepy',
		name: 'Somnolienta',
		description: 'Ojos pesados con cansancio o sueño',
		emoji: '🥱',
		vrm0Blendshapes: {
			Blink: 0.65,
			Sorrow: 0.3,
		},
		vrm1Blendshapes: {
			blink: 0.65,
			sad: 0.3,
		},
	},
	{
		id: 'smug',
		name: 'Presumida',
		description: 'Sonrisa confiada y astuta',
		emoji: '😏',
		vrm0Blendshapes: {
			Fun: 0.8,
			Joy: 0.4,
		},
		vrm1Blendshapes: {
			relaxed: 0.8,
			happy: 0.4,
		},
	},
	{
		id: 'wink_l',
		name: 'Guiño Izquierdo',
		description: 'Guiño de complicidad con ojo izquierdo',
		emoji: '😉',
		vrm0Blendshapes: {
			Blink_L: 1.0,
			Joy: 0.5,
		},
		vrm1Blendshapes: {
			blinkLeft: 1.0,
			happy: 0.5,
		},
	},
	{
		id: 'wink_r',
		name: 'Guiño Derecho',
		description: 'Guiño de complicidad con ojo derecho',
		emoji: '😜',
		vrm0Blendshapes: {
			Blink_R: 1.0,
			Joy: 0.5,
		},
		vrm1Blendshapes: {
			blinkRight: 1.0,
			happy: 0.5,
		},
	},
	{
		id: 'blink',
		name: 'Ojos Cerrados',
		description: 'Ambos ojos cerrados suavemente',
		emoji: '😌',
		vrm0Blendshapes: {
			Blink: 1.0,
		},
		vrm1Blendshapes: {
			blink: 1.0,
		},
	},
];
