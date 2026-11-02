import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AutomaticReactionsCard } from './AutomaticReactionsCard';

describe('AutomaticReactionsCard', () => {
	it('offers the active avatar expressions for each reaction', () => {
		const onMappingChange = vi.fn();
		render(
			<AutomaticReactionsCard
				expressions={[
					{ id: 'joy_sprite', label: 'Alegría personalizada' },
					{ id: 'surprised_sprite', label: 'Sorpresa personalizada' },
				]}
				mappings={{}}
				onMappingChange={onMappingChange}
			/>,
		);

		const surpriseMapping = screen.getByRole('combobox', { name: 'Sorpresa' });
		expect(
			within(surpriseMapping).getByRole('option', { name: 'Alegría personalizada' }),
		).toBeInTheDocument();
		expect(
			within(surpriseMapping).getByRole('option', { name: 'Sorpresa personalizada' }),
		).toBeInTheDocument();

		fireEvent.change(surpriseMapping, { target: { value: 'surprised_sprite' } });
		expect(onMappingChange).toHaveBeenCalledWith('surprised', 'surprised_sprite');
	});
});
