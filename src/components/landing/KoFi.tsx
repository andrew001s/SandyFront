'use client';

import { useEffect, useId } from 'react';

const WIDGET_SRC = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
const OVERLAY_SRC = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
const KOFI_HANDLE = 'shandrew';
const KOFI_TEXT = 'Support me on Ko-fi';
const KOFI_COLOR = '#72a4f2';

let widgetPromise: Promise<void> | null = null;

function loadKoFiWidget() {
	if (!widgetPromise) {
		widgetPromise = new Promise((resolve) => {
			const existing = document.getElementById('kofi-widget-script') as HTMLScriptElement | null;
			if (existing) {
				if (window.kofiwidget2) {
					resolve();
				} else {
					existing.addEventListener('load', () => resolve());
				}
				return;
			}
			const script = document.createElement('script');
			script.id = 'kofi-widget-script';
			script.src = WIDGET_SRC;
			script.async = true;
			script.onload = () => resolve();
			document.body.appendChild(script);
		});
	}
	return widgetPromise;
}

let overlayPromise: Promise<void> | null = null;

function loadKoFiOverlay() {
	if (!overlayPromise) {
		overlayPromise = new Promise((resolve) => {
			const existing = document.getElementById('kofi-overlay-script') as HTMLScriptElement | null;
			if (existing) {
				if (window.kofiWidgetOverlay) {
					resolve();
				} else {
					existing.addEventListener('load', () => resolve());
				}
				return;
			}
			const script = document.createElement('script');
			script.id = 'kofi-overlay-script';
			script.src = OVERLAY_SRC;
			script.async = true;
			script.onload = () => resolve();
			document.body.appendChild(script);
		});
	}
	return overlayPromise;
}

export function KoFiButton() {
	const rootId = useId();
	const containerId = `kofi-widget-${rootId}`;

	useEffect(() => {
		let cancelled = false;
		const root = document.getElementById(containerId);
		if (!root) return;

		loadKoFiWidget().then(() => {
			if (cancelled) return;
			window.kofiwidget2?.init(KOFI_TEXT, KOFI_COLOR, KOFI_HANDLE);
			const html = window.kofiwidget2?.getHTML();
			if (html) {
				root.innerHTML = html;
			}
		});

		return () => {
			cancelled = true;
		};
	}, [containerId]);

	return <div id={containerId} />;
}

export function KoFiOverlay() {
	const containerId = `kofi-overlay-${useId()}`;

	useEffect(() => {
		let cancelled = false;

		loadKoFiOverlay().then(() => {
			if (cancelled) return;
			const root = document.getElementById(containerId);
			if (!root || root.querySelector('.floatingchat-container-wrap')) return;
			window.kofiWidgetOverlay?.draw(
				KOFI_HANDLE,
				{
					type: 'floating-chat',
					'floating-chat.donateButton.text': 'Support me',
					'floating-chat.donateButton.background-color': '#00b9fe',
					'floating-chat.donateButton.text-color': '#fff',
				},
				containerId,
			);
		});

		return () => {
			cancelled = true;
		};
	}, [containerId]);

	return <div id={containerId} />;
}
