import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	applyLive2dFocusPoint,
	applyLive2dMouthParams,
	calculateLive2dFocusPoint,
	stepLive2dFocusDecay,
} from './Live2dRenderer';

describe('Live2dRenderer phonetic mouth parameter injection', () => {
	beforeEach(() => {
		avatar2dManager.setMouthParams(0, 0, false);
		avatar2dManager.setSpeaking(false, false);
	});

	it('injects ParamMouthOpenY and ParamMouthForm into Live2D model core parameters during speech', () => {
		const setParamSpy = vi.fn();
		const mockCoreModel = {
			setParameterValueById: setParamSpy,
		};

		// 1. En reposo (boca cerrada y neutra)
		applyLive2dMouthParams(mockCoreModel, { mouthOpenY: 0, mouthForm: 0 });
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthOpenY', 0);
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthForm', 0);

		setParamSpy.mockClear();

		// 2. Fonema I/E: boca abierta con ensanchamiento / sonrisa (mouthForm > 0)
		applyLive2dMouthParams(mockCoreModel, { mouthOpenY: 0.85, mouthForm: 0.6 });
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthOpenY', 0.85);
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthForm', 0.6);

		setParamSpy.mockClear();

		// 3. Fonema O/U: boca abierta con forma redondeada (mouthForm < 0)
		applyLive2dMouthParams(mockCoreModel, { mouthOpenY: 0.7, mouthForm: -0.5 });
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthOpenY', 0.7);
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthForm', -0.5);

		setParamSpy.mockClear();

		// 4. Parada de audio / retorno a reposo
		applyLive2dMouthParams(mockCoreModel, { mouthOpenY: 0, mouthForm: 0 });
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthOpenY', 0);
		expect(setParamSpy).toHaveBeenCalledWith('ParamMouthForm', 0);
	});

	it('calculates normalized focus coordinates with calibrated bounds and decays smoothly to neutral 0,0', () => {
		const viewport = { width: 1920, height: 1080 };

		// 1. Centro de pantalla: enfoque neutral exacto (0, 0)
		const centerFocus = calculateLive2dFocusPoint(960, 540, viewport);
		expect(centerFocus.x).toBeCloseTo(0, 3);
		expect(centerFocus.y).toBeCloseTo(0, 3);

		// 2. Esquina superior derecha: X > 0, Y > 0 (mirando arriba a la derecha)
		const topRightFocus = calculateLive2dFocusPoint(1920, 0, viewport);
		expect(topRightFocus.x).toBeCloseTo(1, 3);
		expect(topRightFocus.y).toBeCloseTo(1, 3);

		// 3. Fuera de los límites: se sujeta al límite de calibración (clamp = 1.0)
		const clampedFocus = calculateLive2dFocusPoint(2500, -200, viewport);
		expect(clampedFocus.x).toBe(1.0);
		expect(clampedFocus.y).toBe(1.0);

		// 4. Decaimiento y retorno suave hacia reposo neutral (0, 0)
		let current = { x: 1.0, y: 1.0 };
		const neutralTarget = { x: 0, y: 0 };

		// Tras un paso de interpolación hacia neutral, se aproxima a cero sin saltos bruscos
		current = stepLive2dFocusDecay(current, neutralTarget, 0.2);
		expect(current.x).toBeLessThan(1.0);
		expect(current.x).toBeGreaterThan(0.0);
		expect(current.y).toBeLessThan(1.0);
		expect(current.y).toBeGreaterThan(0.0);

		// Converge a neutral tras varios pasos
		for (let i = 0; i < 30; i++) {
			current = stepLive2dFocusDecay(current, neutralTarget, 0.2);
		}
		expect(current.x).toBe(0);
		expect(current.y).toBe(0);
	});

	it('applies focus point to model focusController and coreModel parameters', () => {
		const focusMock = vi.fn();
		const setParamSpy = vi.fn();
		const mockModel = {
			internalModel: {
				focusController: { focus: focusMock },
				coreModel: { setParameterValueById: setParamSpy },
			},
		};

		applyLive2dFocusPoint(mockModel, { x: 0.8, y: -0.4 });

		expect(focusMock).toHaveBeenCalledWith(0.8, -0.4, true);
		expect(setParamSpy).toHaveBeenCalledWith('ParamEyeBallX', 0.8);
		expect(setParamSpy).toHaveBeenCalledWith('ParamEyeBallY', -0.4);
		expect(setParamSpy).toHaveBeenCalledWith('ParamAngleX', 24);
		expect(setParamSpy).toHaveBeenCalledWith('ParamAngleY', -12);
	});
});
