import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AutomaticReactionsCard } from './AutomaticReactionsCard';

describe('AutomaticReactionsCard', () => {
	it('lets the visible status label reactivate an emotion while keeping its expressions visible', () => {
		const onMappingChange = vi.fn();
		const config = { expressions: ['smile', 'eyes'], intensity: 0.7, enabled: false };
		render(
			<AutomaticReactionsCard
				expressions={[{ id: 'smile', label: 'Sonrisa' }]}
				mappings={{ happy: JSON.stringify(config) }}
				onMappingChange={onMappingChange}
			/>,
		);
		expect(screen.getByRole('button', { name: 'Alegría: editar expresiones' })).toHaveTextContent(
			'2 expresiones',
		);
		fireEvent.click(screen.getByText('Apagada'));
		expect(onMappingChange).toHaveBeenCalledWith('happy', { ...config, enabled: true });
	});
	it('blocks changes until the saved reaction settings have loaded', () => {
		const onMappingChange = vi.fn();
		const props = {
			expressions: [{ id: 'smile', label: 'Sonrisa' }],
			mappings: {},
			onMappingChange,
		};
		const { rerender } = render(<AutomaticReactionsCard {...props} disabled />);
		const toggle = screen.getByRole('switch', { name: 'Activar alegría' });
		expect(toggle).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Alegría: editar expresiones' })).toBeDisabled();
		fireEvent.click(toggle);
		expect(onMappingChange).not.toHaveBeenCalled();
		rerender(<AutomaticReactionsCard {...props} />);
		expect(screen.getByRole('switch', { name: 'Activar alegría' })).toBeEnabled();
	});
	it.each(['pngtuber', 'live2d', 'vrm'])(
		'toggles %s emotions without losing the configured expressions',
		(scope) => {
			const onMappingChange = vi.fn();
			const config = { expressions: ['smile', 'eyes'], intensity: 0.7 };
			const props = {
				expressions: [{ id: 'smile', label: 'Sonrisa' }],
				mappings: { [`${scope}:happy`]: JSON.stringify(config) },
				scope,
				onMappingChange,
			};
			const { rerender } = render(<AutomaticReactionsCard {...props} />);
			fireEvent.click(screen.getByRole('switch', { name: 'Activar alegría' }));
			expect(onMappingChange).toHaveBeenLastCalledWith('happy', { ...config, enabled: false });
			rerender(
				<AutomaticReactionsCard
					{...props}
					mappings={{ [`${scope}:happy`]: JSON.stringify({ ...config, enabled: false }) }}
				/>,
			);
			expect(screen.getByRole('switch', { name: 'Activar alegría' })).not.toBeChecked();
			expect(screen.getByRole('button', { name: 'Alegría: editar expresiones' })).toBeDisabled();
			fireEvent.click(screen.getByRole('switch', { name: 'Activar alegría' }));
			expect(onMappingChange).toHaveBeenLastCalledWith('happy', { ...config, enabled: true });
		},
	);
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

	it('sizes the expression editor to its content within a viewport cap', () => {
		render(
			<AutomaticReactionsCard
				expressions={[{ id: 'smile', label: 'Sonrisa' }]}
				mappings={{}}
				onMappingChange={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Expresión base: editar expresiones' }));

		expect(screen.getByRole('dialog')).toHaveClass('h-fit', 'max-h-[min(90dvh,42rem)]');
	});
});
