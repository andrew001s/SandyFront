import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	applyLive2dExpression,
	applyLive2dExpressionParams,
	applyLive2dFocusPoint,
	applyLive2dMouthParams,
	calculateLive2dFocusPoint,
	findExpressionUrlInFileMap,
	parseLive2dExpressionParams,
	resetLive2dExpressionParams,
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

	it('applies active Live2D expression directly to the rendered model instance', () => {
		const expressionSpy = vi.fn();
		const resetExpressionSpy = vi.fn();
		const mockModel = {
			expression: expressionSpy,
			internalModel: {
				motionManager: {
					expressionManager: {
						resetExpression: resetExpressionSpy,
					},
				},
			},
		};

		// 1. Activar una expresión
		applyLive2dExpression(mockModel, 'Blush');
		expect(expressionSpy).toHaveBeenCalledWith('Blush');

		// 2. Desactivar / resetear expresión al neutral
		applyLive2dExpression(mockModel, null);
		expect(resetExpressionSpy).toHaveBeenCalledTimes(1);
	});

	it('injects expression parameters directly into core model via applyLive2dExpressionParams', () => {
		const addParamSpy = vi.fn();
		const setParamSpy = vi.fn();
		const mockCore = {
			addParameterValueById: addParamSpy,
			setParameterValueById: setParamSpy,
		};

		const params = [
			{ Id: 'Blush', Value: 1.0, Blend: 'Add' },
			{ Id: 'FangedSmile', Value: 1.0, Blend: 'Overwrite' },
		];

		applyLive2dExpressionParams(mockCore, params);

		expect(addParamSpy).toHaveBeenCalledWith('Blush', 1.0);
		expect(setParamSpy).toHaveBeenCalledWith('FangedSmile', 1.0);
	});

	it('finds expression blob url in fileMap by matching basename, filename, or id', () => {
		const fileMap = {
			'RetrynowMiku/VTS Model File/Blush.exp3.json': 'blob:http://localhost/blush-full',
			'Blush.exp3.json': 'blob:http://localhost/blush',
			'Dead Eyes.exp3.json': 'blob:http://localhost/dead-eyes',
		};

		expect(findExpressionUrlInFileMap(fileMap, 'Blush')).toBe('blob:http://localhost/blush');
		expect(findExpressionUrlInFileMap(fileMap, 'Dead Eyes')).toBe(
			'blob:http://localhost/dead-eyes',
		);
		expect(findExpressionUrlInFileMap(fileMap, 'Unknown')).toBeNull();
	});

	it('resets expression parameters to default or zero values when deactivated via resetLive2dExpressionParams', () => {
		const setParamSpy = vi.fn();
		const getParamIndexSpy = vi.fn((id: string) => (id === 'ParamCheek' ? 2 : -1));
		const getParamDefaultSpy = vi.fn((idx: number) => (idx === 2 ? 0.0 : 0.0));

		const mockCore = {
			setParameterValueById: setParamSpy,
			getParameterIndex: getParamIndexSpy,
			getParameterDefaultValue: getParamDefaultSpy,
		};

		const params = [
			{ Id: 'ParamCheek', Value: 1.0, Blend: 'Add' },
			{ Id: 'ParamCustom', Value: 0.8, Blend: 'Overwrite' },
		];

		resetLive2dExpressionParams(mockCore, params);

		expect(setParamSpy).toHaveBeenCalledWith('ParamCheek', 0.0);
		expect(setParamSpy).toHaveBeenCalledWith('ParamCustom', 0.0);
	});

	it('parses expression parameters from both Cubism 4 (Parameters) and Cubism 2/3 (params) formats', () => {
		const cubism4Data = {
			Type: 'Live2D Expression',
			Parameters: [{ Id: 'ParamCheek', Value: 1.0, Blend: 'Add' }],
		};
		const cubism2Data = {
			type: 'Live2D Expression',
			params: [{ id: 'PARAM_CHEEK', val: 0.8, calc: 'add' }],
		};

		expect(parseLive2dExpressionParams(cubism4Data)).toEqual([
			{ Id: 'ParamCheek', Value: 1.0, Blend: 'Add' },
		]);
		expect(parseLive2dExpressionParams(cubism2Data)).toEqual([
			{ Id: 'PARAM_CHEEK', Value: 0.8, Blend: 'Add' },
		]);
	});
});
