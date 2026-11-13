export function expressionChord(
	event: Pick<KeyboardEvent, 'code' | 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
): string | null {
	const code = event.code;
	if (event.altKey && (code === 'F4' || code === 'ArrowLeft' || code === 'ArrowRight')) return null;
	if (
		!code ||
		/^(Control|Shift|Alt|Meta)/.test(code) ||
		['Escape', 'Tab', 'Enter', 'Space', 'Backspace', 'Delete', 'F1', 'F5', 'F11', 'F12'].includes(
			code,
		)
	)
		return null;
	if ((event.ctrlKey || event.metaKey) && /^(Key[BFLNPQRTUW]|Digit\d)$/.test(code)) return null;
	return [
		event.ctrlKey && 'Ctrl',
		event.metaKey && 'Meta',
		event.altKey && 'Alt',
		event.shiftKey && 'Shift',
		code,
	]
		.filter(Boolean)
		.join('+');
}

export function formatExpressionChord(chord: string): string {
	return chord
		.replace(/Key|Digit/g, '')
		.replace('Meta', '⌘')
		.replace('Arrow', 'Flecha ');
}

export function isTypingTarget(target: EventTarget | null): boolean {
	return (
		target instanceof Element &&
		!!target.closest(
			'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"], dialog, [data-hotkey-recorder][aria-pressed="true"]',
		)
	);
}
