import { vrmManager } from '@/lib/avatar/vrmManager';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VrmStudioExpressionsPanel } from './VrmStudioExpressionsPanel';

afterEach(() => {
	act(() => vrmManager.resetEmotions());
	vi.restoreAllMocks();
});
describe('VRM manual expression switches', () => {
	it('mixes and deactivates model expressions and reflects changes from outside the panel', () => {
		vi.spyOn(vrmManager, 'getAvailableExpressions').mockReturnValue(['happy', 'catMouth']);
		vrmManager.resetEmotions();
		render(<VrmStudioExpressionsPanel onClose={vi.fn()} />);
		const custom = screen.getByRole('switch', { name: /catMouth/i });
		const happy = screen.getByRole('switch', { name: /happy/i });
		expect(custom).not.toBeChecked();
		fireEvent.click(custom);
		fireEvent.click(happy);
		expect(custom).toBeChecked();
		expect(happy).toBeChecked();
		expect(vrmManager.getActiveExpressions()).toEqual(['catMouth', 'happy']);
		fireEvent.click(custom);
		expect(custom).not.toBeChecked();
		expect(happy).toBeChecked();
		act(() => vrmManager.setEmotions(['catMouth'], 0.5));
		expect(custom).toBeChecked();
		expect(happy).not.toBeChecked();
	});
});
