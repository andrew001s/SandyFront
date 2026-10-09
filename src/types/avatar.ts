export type AvatarSoftware = 'vtubestudio' | 'vseeface';

export type SoftwareMeta = {
	id: AvatarSoftware;
	name: string;
	shortName: string;
	dimension: '2d' | '3d';
	description: string;
	badge: string;
	defaultPort: number;
	features: {
		live2dModels: boolean;
		vrmBlendshapes: boolean;
		hotkeys: boolean;
		expressions: boolean;
		lipSync: boolean;
		modelTransform: boolean;
	};
};

export type SoftwareConfig = {
	port: number;
	host: string;
	transitionDurationMs?: number;
};

export type AvatarSoftwareConfigs = Record<AvatarSoftware, SoftwareConfig>;

export type VRMEmotionPreset = {
	id: string;
	name: string;
	description: string;
	emoji: string;
	vrm0Blendshapes: Record<string, number>;
	vrm1Blendshapes: Record<string, number>;
};

export type AvatarConnectionStats = {
	packetsSent: number;
	lastPingMs: number | null;
	connectedAt: string;
};
