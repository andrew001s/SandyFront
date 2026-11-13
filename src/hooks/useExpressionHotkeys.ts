'use client';

import { useExpressionHotkeysContext } from '@/context/ExpressionHotkeysContext';
import { expressionChord, isTypingTarget } from '@/lib/avatar/expressionHotkeys';
import { useEffect } from 'react';

export function useExpressionHotkeys(
	scope: string,
	expressions: { id: string }[],
	toggle: (id: string) => void,
) {
	const context = useExpressionHotkeysContext();
	useEffect(() => {
		if (!context || context.status === 'loading') return;
		const handler = (event: KeyboardEvent) => {
			if (
				event.defaultPrevented ||
				event.repeat ||
				event.isComposing ||
				isTypingTarget(event.target)
			)
				return;
			const chord = expressionChord(event);
			if (!chord) return;
			const expression = expressions.find(({ id }) => context.bindings[`${scope}:${id}`] === chord);
			if (!expression) return;
			event.preventDefault();
			toggle(expression.id);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [context, scope, expressions, toggle]);
}
