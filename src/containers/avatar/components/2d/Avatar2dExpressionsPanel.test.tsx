import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Avatar2dExpressionsPanel } from './Avatar2dExpressionsPanel';

describe('Avatar2dExpressionsPanel custom expressions', () => {
	it('shows validation error and prevents submission when name or image is missing', async () => {
		const addSpy = vi.spyOn(avatar2dManager, 'addCustomEmotion');
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		// Open creation form
		const openFormBtn = screen.getByRole('button', { name: /nueva expresión/i });
		fireEvent.click(openFormBtn);

		// Try to submit without name and without image
		const submitBtn = screen.getByRole('button', { name: /guardar expresión/i });
		fireEvent.click(submitBtn);

		// Must not call manager to save
		expect(addSpy).not.toHaveBeenCalled();

		// Should display validation error message
		expect(screen.getByText(/el nombre es obligatorio|selecciona una imagen/i)).toBeInTheDocument();
	});

	it('renders newly created custom expression in the expressions list upon submission', async () => {
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		// Open creation form
		fireEvent.click(screen.getByRole('button', { name: /nueva expresión/i }));

		// Enter name
		const nameInput = screen.getByPlaceholderText(/nombre de la expresión/i);
		fireEvent.change(nameInput, { target: { value: 'Guiño Sorpresa' } });

		// Upload image file with mocked FileReader
		const readAsDataURLSpy = vi
			.spyOn(FileReader.prototype, 'readAsDataURL')
			.mockImplementation(function (this: FileReader) {
				Object.defineProperty(this, 'result', {
					value: 'data:image/png;base64,mocked_guino_image',
				});
				this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
			});

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		const file = new File(['dummy'], 'guino.png', { type: 'image/png' });
		fireEvent.change(fileInput, { target: { files: [file] } });

		// Submit form
		fireEvent.click(screen.getByRole('button', { name: /guardar expresión/i }));

		// The new expression button must be rendered in the expressions list
		expect(await screen.findByRole('button', { name: /guiño sorpresa/i })).toBeInTheDocument();

		readAsDataURLSpy.mockRestore();
	});
});
