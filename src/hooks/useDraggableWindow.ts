'use client';

import { useDraggable } from '@reactuses/core';
import {
	type KeyboardEvent,
	type RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

export function useDraggableWindow() {
	const [element, setElement] = useState<HTMLDivElement | null>(null);
	const handle = useRef<HTMLDivElement>(null);
	const [x, y, isDragging, setPosition] = useDraggable(element, {
		handle: element ? (handle as RefObject<HTMLDivElement>) : undefined,
		containerElement: () => document.documentElement,
		preventDefault: true,
		onStart: (_position, event) => {
			if (event.button !== 0 || (event.target as Element).closest('button, input, a')) return false;
			handle.current?.focus();
		},
	});
	const reset = useCallback(() => {
		if (!element) return;
		setPosition({
			x: Math.max(8, (innerWidth - element.offsetWidth) / 2),
			y: Math.max(8, (innerHeight - element.offsetHeight) / 2),
		});
	}, [element, setPosition]);
	useLayoutEffect(reset, [reset]);
	useEffect(() => {
		window.addEventListener('resize', reset);
		return () => window.removeEventListener('resize', reset);
	}, [reset]);
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Home') {
			event.preventDefault();
			reset();
			return;
		}
		const movement = {
			ArrowLeft: [-20, 0],
			ArrowRight: [20, 0],
			ArrowUp: [0, -20],
			ArrowDown: [0, 20],
		}[event.key];
		if (!movement || !element) return;
		event.preventDefault();
		setPosition({
			x: Math.max(8, Math.min(innerWidth - element.offsetWidth - 8, x + movement[0])),
			y: Math.max(8, Math.min(innerHeight - element.offsetHeight - 8, y + movement[1])),
		});
	};
	return {
		style: { left: x, top: y },
		dialogRef: setElement,
		isDragging,
		reset,
		handleProps: { ref: handle, onKeyDown },
	};
}
