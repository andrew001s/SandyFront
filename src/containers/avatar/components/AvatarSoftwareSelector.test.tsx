import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AvatarSoftwareSelector } from './AvatarSoftwareSelector';

describe('AvatarSoftwareSelector', () => {
	it('AvatarSoftwareSelector renders independent options for PNGTuber, Live2D, and 3D VRM', () => {
		render(
			<AvatarSoftwareSelector
				selectedSoftware='pngtuber'
				connectedSoftware={null}
				isConnecting={false}
				onSelect={vi.fn()}
			/>,
		);

		expect(screen.getByRole('tab', { name: /pngtuber/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /live2d/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /3d/i })).toBeInTheDocument();
	});

	it('AvatarSoftwareSelector triggers callback with chosen format when clicked', async () => {
		const onSelect = vi.fn();
		render(
			<AvatarSoftwareSelector
				selectedSoftware='pngtuber'
				connectedSoftware={null}
				isConnecting={false}
				onSelect={onSelect}
			/>,
		);

		const live2dTab = screen.getByRole('tab', { name: /live2d/i });
		fireEvent.click(live2dTab);

		expect(onSelect).toHaveBeenCalledWith('live2d');
	});
});
