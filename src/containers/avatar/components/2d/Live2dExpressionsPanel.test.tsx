import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Live2dExpressionsPanel } from './Live2dExpressionsPanel';

describe('Live2dExpressionsPanel', () => {
	beforeEach(() => {
		live2dStore.setPackage(null);
		avatar2dManager.setLive2dExpression(null);
	});

	it('renders Live2D expressions panel with dedicated header and empty state when no model is loaded', () => {
		const onClose = vi.fn();
		const onOpenModelSelect = vi.fn();

		render(<Live2dExpressionsPanel onClose={onClose} onOpenModelSelect={onOpenModelSelect} />);

		// Header dedicated to Live2D
		expect(screen.getByText(/expresiones live2d/i)).toBeInTheDocument();

		// Empty state is displayed when no package is loaded
		expect(screen.getByText(/sin modelo live2d/i)).toBeInTheDocument();
		expect(screen.getByText(/carga un modelo/i)).toBeInTheDocument();

		// Quick action button to open model selector if provided
		const loadModelBtn = screen.getByRole('button', { name: /cargar modelo/i });
		expect(loadModelBtn).toBeInTheDocument();
		fireEvent.click(loadModelBtn);
		expect(onOpenModelSelect).toHaveBeenCalledTimes(1);

		// Close button works
		const closeBtn = screen.getByRole('button', { name: /cerrar|close/i });
		fireEvent.click(closeBtn);
		expect(onClose).toHaveBeenCalledTimes(1);

		// Does NOT contain PNGTuber specific options
		expect(screen.queryByText(/nueva expresión/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/probar boca abierta/i)).not.toBeInTheDocument();
	});

	it('extracts and renders native expressions from loaded Live2D model package with clean formatted labels', () => {
		const onClose = vi.fn();
		live2dStore.setPackage({
			modelSettingsJson: {
				Version: 3,
				FileReferences: {
					Expressions: [
						{ Name: 'exp_01_smile', File: 'expressions/exp_01_smile.exp3.json' },
						{ Name: 'f02_angry', File: 'expressions/f02_angry.exp3.json' },
						{ File: 'expressions/surprised.exp3.json' },
					],
				},
			},
			modelName: 'Hiyori',
			fileMap: {},
			blobUrls: [],
		});

		render(<Live2dExpressionsPanel onClose={onClose} />);

		expect(screen.getByText(/hiyori/i)).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: /smile/i })).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: /angry/i })).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: /surprised/i })).toBeInTheDocument();
	});

	it('renders expressions as toggle switches and toggles expression on and off when clicked', () => {
		const onClose = vi.fn();
		live2dStore.setPackage({
			modelSettingsJson: {
				Version: 3,
				FileReferences: {
					Expressions: [
						{ Name: 'exp_01_smile', File: 'expressions/exp_01_smile.exp3.json' },
						{ Name: 'f02_angry', File: 'expressions/f02_angry.exp3.json' },
					],
				},
			},
			modelName: 'Hiyori',
			fileMap: {},
			blobUrls: [],
		});

		render(<Live2dExpressionsPanel onClose={onClose} />);

		const smileToggle = screen.getByRole('switch', { name: /smile/i });
		expect(smileToggle).toHaveAttribute('aria-checked', 'false');

		// 1. Click to turn ON
		fireEvent.click(smileToggle);
		expect(smileToggle).toHaveAttribute('aria-checked', 'true');
		expect(avatar2dManager.getState().live2d.activeExpressions).toContain('exp_01_smile');

		// 2. Click again to turn OFF (toggle behavior)
		fireEvent.click(smileToggle);
		expect(smileToggle).toHaveAttribute('aria-checked', 'false');
		expect(avatar2dManager.getState().live2d.activeExpressions).not.toContain('exp_01_smile');
	});

	it('displays informative empty state when loaded Live2D model defines no expressions', () => {
		const onClose = vi.fn();
		live2dStore.setPackage({
			modelSettingsJson: {
				Version: 3,
				FileReferences: {
					Expressions: [],
				},
			},
			modelName: 'Mao',
			fileMap: {},
			blobUrls: [],
		});

		render(<Live2dExpressionsPanel onClose={onClose} />);

		expect(screen.getByText(/mao/i)).toBeInTheDocument();
		expect(screen.getByText(/sin expresiones preconfiguradas/i)).toBeInTheDocument();
	});

	it('detects expression files from fileMap when modelSettingsJson lacks FileReferences.Expressions (e.g. VTS models)', () => {
		const onClose = vi.fn();
		live2dStore.setPackage({
			modelSettingsJson: {
				Version: 3,
				FileReferences: {
					Moc: 'model.moc3',
				},
			},
			fileMap: {
				'Blush.exp3.json': 'blob:http://localhost/blush',
				'Fanged Smile.exp3.json': 'blob:http://localhost/smile',
				'models/Dead Eyes.exp3.json': 'blob:http://localhost/dead',
			},
			modelName: 'RetrynowMiku',
			blobUrls: [],
		});

		render(<Live2dExpressionsPanel onClose={onClose} />);

		expect(screen.getByRole('switch', { name: /blush/i })).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: /fanged smile/i })).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: /dead eyes/i })).toBeInTheDocument();
	});
});
