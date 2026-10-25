export const VRM_IDLE_BONES = [
	'hips',
	'spine',
	'chest',
	'upperChest',
	'neck',
	'head',
	'leftShoulder',
	'rightShoulder',
	'leftUpperArm',
	'rightUpperArm',
	'leftLowerArm',
	'rightLowerArm',
	'leftHand',
	'rightHand',
] as const;

export type VrmIdleBoneName = (typeof VRM_IDLE_BONES)[number];

export interface VrmIdleSettings {
	enabled: boolean;
	breathAmount: number;
	swayAmount: number;
	speed: number;
	smoothSeconds: number;
}

export interface VrmIdleRotation {
	x: number;
	y: number;
	z: number;
}

export type VrmIdlePose = Partial<Record<VrmIdleBoneName, VrmIdleRotation>>;

export const DEFAULT_VRM_IDLE_SETTINGS: VrmIdleSettings = {
	enabled: true,
	breathAmount: 1,
	swayAmount: 1,
	speed: 1,
	smoothSeconds: 0.35,
};

export const VRM_RELAXED_ARM_POSE: Partial<Record<VrmIdleBoneName, VrmIdleRotation>> = {
	leftUpperArm: { x: 0.05, y: 0.02, z: 1.35 },
	rightUpperArm: { x: 0.05, y: -0.02, z: -1.35 },
	leftLowerArm: { x: 0.05, y: 0.15, z: 0.05 },
	rightLowerArm: { x: 0.05, y: -0.15, z: -0.05 },
	leftHand: { x: 0.02, y: 0, z: 0 },
	rightHand: { x: 0.02, y: 0, z: 0 },
};

const clamp = (value: number, min: number, max: number, fallback: number): number =>
	Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function normalizeVrmIdleSettings(
	settings: Partial<VrmIdleSettings>,
	base: VrmIdleSettings = DEFAULT_VRM_IDLE_SETTINGS,
): VrmIdleSettings {
	const input = settings ?? {};
	return {
		enabled: typeof input.enabled === 'boolean' ? input.enabled : base.enabled,
		breathAmount: clamp(input.breathAmount ?? base.breathAmount, 0, 2, base.breathAmount),
		swayAmount: clamp(input.swayAmount ?? base.swayAmount, 0, 2, base.swayAmount),
		speed: clamp(input.speed ?? base.speed, 0.25, 2, base.speed),
		smoothSeconds: clamp(input.smoothSeconds ?? base.smoothSeconds, 0, 2, base.smoothSeconds),
	};
}

const rotation = (x = 0, y = 0, z = 0): VrmIdleRotation => ({ x, y, z });

/** Samples the standing idle from absolute time so its pose does not depend on frame rate. */
export function sampleVrmIdlePose(elapsedSeconds: number, settings: VrmIdleSettings): VrmIdlePose {
	const time = Math.max(0, elapsedSeconds) * settings.speed;
	const tau = Math.PI * 2;
	const breathPhase = (tau * time) / 3.4;
	const breath =
		(Math.sin(breathPhase) - 0.16 * Math.sin(2 * breathPhase + 0.35)) * settings.breathAmount;
	const weightShift =
		(Math.sin((tau * time) / 6.8) + 0.18 * Math.sin((tau * time) / 3.4 + 0.8)) *
		settings.swayAmount;
	const headTurn = Math.sin((tau * time) / 8.6 + 0.55) * settings.swayAmount;
	const headNod = Math.sin((tau * time) / 5.3 + 1.1) * settings.swayAmount;
	const pose: VrmIdlePose = {
		// Live2D's body-angle channels are divided across hips, spine, and chest.
		// The supplied VTS profile uses ±10° body motion and ±30° head tracking.
		hips: rotation(0, weightShift * 0.025, weightShift * 0.018),
		spine: rotation(breath * 0.035, weightShift * 0.022, weightShift * 0.012),
		chest: rotation(breath * 0.052, weightShift * 0.012, weightShift * 0.02),
		upperChest: rotation(breath * 0.026, 0, weightShift * 0.012),
		neck: rotation(-breath * 0.014 - headNod * 0.012, -headTurn * 0.018, -weightShift * 0.012),
		head: rotation(-breath * 0.018 + headNod * 0.035, headTurn * 0.075, -weightShift * 0.026),
		leftShoulder: rotation(0, 0, -breath * 0.022 - weightShift * 0.012),
		rightShoulder: rotation(0, 0, breath * 0.022 + weightShift * 0.012),
		leftUpperArm: rotation(0, weightShift * 0.012, -breath * 0.008),
		rightUpperArm: rotation(0, -weightShift * 0.012, breath * 0.008),
	};

	return pose;
}
