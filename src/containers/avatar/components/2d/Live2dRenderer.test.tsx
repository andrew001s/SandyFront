import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLive2dMouthParams } from './Live2dRenderer';

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
});
