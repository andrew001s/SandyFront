import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AutomaticReactionsCard } from './AutomaticReactionsCard';

describe('AutomaticReactionsCard', () => {
	it('selects multiple expressions, previews them, and saves the configuration', () => {
		const onMappingChange = vi.fn();
		const onPreview = vi.fn();
		const onPreviewEnd = vi.fn();
		render(
			<AutomaticReactionsCard
				expressions={[
					{ id: 'joy_sprite', label: 'Alegría personalizada' },
					{ id: 'surprised_sprite', label: 'Sorpresa personalizada' },
				]}
				mappings={{}}
				allowMultiple
				onMappingChange={onMappingChange}
				onPreview={onPreview}
				onPreviewEnd={onPreviewEnd}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Sorpresa: editar expresiones' }));
		fireEvent.click(screen.getByRole('checkbox', { name: 'Alegría personalizada' }));
		fireEvent.click(screen.getByRole('checkbox', { name: 'Sorpresa personalizada' }));
		fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
		expect(onPreview).toHaveBeenCalledWith('surprised', {
			expressions: ['joy_sprite', 'surprised_sprite'],
			intensity: 1,
		});

		fireEvent.click(screen.getByRole('button', { name: 'Guardar selección' }));
		expect(onMappingChange).toHaveBeenCalledWith('surprised', {
			expressions: ['joy_sprite', 'surprised_sprite'],
			intensity: 1,
		});
		expect(onPreviewEnd).toHaveBeenCalledOnce();
	});
});
