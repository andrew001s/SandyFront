import { fireEvent, render, screen } from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDraggableWindow } from './useDraggableWindow';

function Window() {
	const [open, setOpen] = useState(false);
	const window = useDraggableWindow();
	if (!open)
		return createElement(
			'button',
			{ type: 'button', onClick: () => setOpen(true) },
			'Abrir ventana',
		);
	return createElement(
		'div',
		{ ref: window.dialogRef, style: window.style, 'data-testid': 'window' },
		createElement('div', { ...window.handleProps, tabIndex: 0, 'data-testid': 'handle' }, 'Mover'),
	);
}
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
describe('ReactUse window dragging', () => {
	it('drags by the header, stays within the viewport, stops on release and recenters with Home', () => {
		vi.stubGlobal('innerWidth', 1024);
		vi.stubGlobal('innerHeight', 768);
		vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300);
		vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(768);
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
			this: HTMLElement,
		) {
			const left = Number.parseFloat(this.style.left) || 0;
			const top = Number.parseFloat(this.style.top) || 0;
			return {
				left,
				top,
				right: left + 300,
				bottom: top + 200,
				width: 300,
				height: 200,
			} as DOMRect;
		});
		render(createElement(Window));
		fireEvent.click(screen.getByRole('button', { name: 'Abrir ventana' }));
		const dialog = screen.getByTestId('window');
		const handle = screen.getByTestId('handle');
		expect(dialog).toHaveStyle({ left: '362px', top: '284px', transition: 'none' });
		fireEvent(
			handle,
			new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 400, clientY: 300 }),
		);
		fireEvent(window, new MouseEvent('pointermove', { clientX: 450, clientY: 340 }));
		expect(dialog).toHaveStyle({ left: '412px', top: '324px' });
		fireEvent(window, new MouseEvent('pointermove', { clientX: -1000, clientY: -1000 }));
		expect(dialog).toHaveStyle({ left: '0px', top: '0px' });
		fireEvent(window, new MouseEvent('pointerup'));
		fireEvent(window, new MouseEvent('pointermove', { clientX: 700, clientY: 700 }));
		expect(dialog).toHaveStyle({ left: '0px', top: '0px' });
		fireEvent.keyDown(handle, { key: 'Home' });
		expect(dialog).toHaveStyle({ left: '362px', top: '284px' });
		fireEvent.keyDown(handle, { key: 'ArrowRight' });
		expect(dialog).toHaveStyle({ left: '382px' });
		fireEvent(window, new Event('resize'));
		expect(dialog).toHaveStyle({ left: '362px' });
	});
});
