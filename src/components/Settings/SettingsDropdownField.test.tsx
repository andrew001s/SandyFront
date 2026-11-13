import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsDropdownField } from './SettingsDropdownField';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe = vi.fn();
			unobserve = vi.fn();
			disconnect = vi.fn();
		},
	);
	HTMLElement.prototype.scrollIntoView = vi.fn();
});

function Example() {
	const [value, setValue] = useState('es');
	const [open, setOpen] = useState(false);
	return (
		<SettingsDropdownField
			label='Idioma'
			placeholder='Elegir idioma'
			value={value}
			onChange={setValue}
			open={open}
			setOpen={setOpen}
			options={[
				{ value: 'es', label: 'Español' },
				{ value: 'en', label: 'English' },
			]}
		/>
	);
}

describe('settings dropdown keyboard behavior', () => {
	it('exposes its label and selected option, closes on Escape and returns focus', async () => {
		render(<Example />);
		const trigger = screen.getByRole('combobox', { name: 'Idioma' });
		fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		expect(await screen.findByRole('option', { name: 'Español' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	});
});
