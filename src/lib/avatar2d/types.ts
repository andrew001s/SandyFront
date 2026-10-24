export type Avatar2dMode = 'pngtuber' | 'live2d';

export type PngTuberSpriteKey = 'idle' | 'speaking' | 'blink' | 'speakingBlink';

export interface PngTuberEmotion {
	id: string;
	label: string;
	idle: string;
	speaking?: string;
	blink?: string;
}

export interface PngTuberPhysics {
	bounceAmount: number; // 0 a 30 px
	bounceSpeed: number; // 100 a 400 ms
	breathing: boolean; // movimiento suave idle
	blinkInterval: number; // 2500 a 6000 ms
}

export interface Avatar2dTransform {
	x: number;
	y: number;
	scale: number;
	rotation: number;
}

export interface PngTuberConfig {
	sprites: Record<PngTuberSpriteKey, string>;
	activeEmotion: string;
	emotions: PngTuberEmotion[];
	physics: PngTuberPhysics;
	transform: Avatar2dTransform;
}

export interface Live2dConfig {
	modelUrl: string | null;
	modelName?: string;
	transform: Avatar2dTransform;
	eyeTracking: boolean;
	autoBlink: boolean;
	breath: boolean;
}

export interface Avatar2dState {
	mode: Avatar2dMode;
	pngtuber: PngTuberConfig;
	live2d: Live2dConfig;
}

export type Avatar2dActiveTool =
	| 'expressions'
	| 'emotions'
	| 'lipsync'
	| 'background'
	| 'settings'
	| 'model'
	| null;

export type Avatar2dSyncMessage =
	| { type: 'speaking'; speaking: boolean }
	| { type: 'emotion'; emotion: string }
	| { type: 'emotions'; emotions: PngTuberEmotion[] }
	| { type: 'mode'; mode: Avatar2dMode }
	| { type: 'transform'; transform: Avatar2dTransform; target: Avatar2dMode }
	| { type: 'physics'; physics: PngTuberPhysics }
	| { type: 'sprites'; sprites: Record<PngTuberSpriteKey, string> }
	| { type: 'live2dModel'; modelUrl: string | null; modelName?: string }
	| { type: 'mouth'; mouthOpenY: number; mouthForm: number }
	| { type: 'eyeTracking'; enabled: boolean }
	| { type: 'requestState' }
	| { type: 'fullState'; state: Avatar2dState };
