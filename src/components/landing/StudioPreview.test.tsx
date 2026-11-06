import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudioPreview } from './StudioPreview';

describe('StudioPreview', () => {
	it('changes the actual PNG expression when the visitor selects a reaction', () => {
		render(<StudioPreview />);
		fireEvent.click(screen.getByRole('button', { name: 'Alegría' }));
		expect(screen.getByRole('img', { name: 'Sandy: Alegría' }).getAttribute('src')).toContain(
			'sandy_happy',
		);
		expect(screen.getByRole('button', { name: 'Alegría' })).toHaveAttribute('aria-pressed', 'true');
	});
});
