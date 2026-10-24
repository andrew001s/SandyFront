import '@testing-library/jest-dom/vitest';

if (!window.HTMLElement.prototype.hasPointerCapture) {
	window.HTMLElement.prototype.hasPointerCapture = () => false;
	window.HTMLElement.prototype.setPointerCapture = () => {
		// Mock for jsdom environment
	};
	window.HTMLElement.prototype.releasePointerCapture = () => {
		// Mock for jsdom environment
	};
}
