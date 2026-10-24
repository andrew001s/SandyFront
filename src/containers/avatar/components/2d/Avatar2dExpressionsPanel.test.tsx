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
		expect(await screen.findByRole('button', { name: /^guiño sorpresa/i })).toBeInTheDocument();

		readAsDataURLSpy.mockRestore();
	});

	it('triggers expression activation and updates active state when clicked from dock expressions panel', () => {
		const setEmotionSpy = vi.spyOn(avatar2dManager, 'setEmotion');
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		// Click on an expression button (e.g., "Feliz / Radiante")
		const happyBtn = screen.getByRole('button', { name: /^feliz/i });
		fireEvent.click(happyBtn);

		expect(setEmotionSpy).toHaveBeenCalledWith('happy');
		expect(avatar2dManager.getState().pngtuber.activeEmotion).toBe('happy');
	});

	it('resets active expression back to neutral when reset button is clicked', () => {
		avatar2dManager.setEmotion('happy');
		const setEmotionSpy = vi.spyOn(avatar2dManager, 'setEmotion');
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		const resetBtn = screen.getByRole('button', { name: /restablecer a neutral/i });
		fireEvent.click(resetBtn);

		expect(setEmotionSpy).toHaveBeenCalledWith('neutral');
		expect(avatar2dManager.getState().pngtuber.activeEmotion).toBe('neutral');
	});

	it('renders edit button for both default and custom expressions', () => {
		avatar2dManager.addCustomEmotion('Guiño Custom', 'data:image/png;base64,custom_idle');
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		// Custom expression must have an edit button
		const customEditBtn = screen.getByRole('button', { name: /editar guiño custom/i });
		expect(customEditBtn).toBeInTheDocument();

		// Default expression (e.g., "Feliz / Radiante") now also has an edit button
		const defaultEditBtn = screen.getByRole('button', { name: /editar feliz/i });
		expect(defaultEditBtn).toBeInTheDocument();
	});

	it('allows editing default expression label and image and saves changes to manager', async () => {
		const updateSpy = vi.spyOn(avatar2dManager, 'updateCustomEmotion');
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		const editHappyBtn = screen.getByRole('button', { name: /editar feliz/i });
		fireEvent.click(editHappyBtn);

		const nameInput = screen.getByPlaceholderText(/nombre de la expresión/i) as HTMLInputElement;
		expect(nameInput.value).toBe('Feliz / Radiante');

		fireEvent.change(nameInput, { target: { value: 'Super Alegre' } });

		const saveBtn = screen.getByRole('button', { name: /guardar cambios/i });
		fireEvent.click(saveBtn);

		expect(updateSpy).toHaveBeenCalledWith(
			'happy',
			expect.objectContaining({
				label: 'Super Alegre',
			}),
		);
		expect(await screen.findByRole('button', { name: /^super alegre/i })).toBeInTheDocument();
	});

	it('opens edit form with current expression values, saves updated image and label, and updates list', async () => {
		const created = avatar2dManager.addCustomEmotion(
			'Guiño Antiguo',
			'data:image/png;base64,old_idle',
		);
		const updateSpy = vi.spyOn(avatar2dManager, 'updateCustomEmotion');
		render(<Avatar2dExpressionsPanel onClose={vi.fn()} />);

		// Click edit button for the custom expression
		const editBtn = screen.getByRole('button', { name: /editar guiño antiguo/i });
		fireEvent.click(editBtn);

		// Verify form opens with pre-populated name
		const nameInput = screen.getByPlaceholderText(/nombre de la expresión/i) as HTMLInputElement;
		expect(nameInput.value).toBe('Guiño Antiguo');
		expect(screen.getByText(/editar "guiño antiguo"/i)).toBeInTheDocument();

		// Change name
		fireEvent.change(nameInput, { target: { value: 'Guiño Actualizado' } });

		// Change image via mocked FileReader
		const readAsDataURLSpy = vi
			.spyOn(FileReader.prototype, 'readAsDataURL')
			.mockImplementation(function (this: FileReader) {
				Object.defineProperty(this, 'result', {
					value: 'data:image/png;base64,new_idle_image',
				});
				this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
			});

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		const file = new File(['dummy_new'], 'guino_new.png', { type: 'image/png' });
		fireEvent.change(fileInput, { target: { files: [file] } });

		// Submit edit form
		const saveBtn = screen.getByRole('button', { name: /guardar cambios/i });
		fireEvent.click(saveBtn);

		// Verify avatar2dManager.updateCustomEmotion was called
		expect(updateSpy).toHaveBeenCalledWith(
			created.id,
			expect.objectContaining({
				label: 'Guiño Actualizado',
				idle: 'data:image/png;base64,new_idle_image',
			}),
		);

		// Verify updated expression appears in list and old label is gone
		expect(await screen.findByRole('button', { name: /^guiño actualizado/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^guiño antiguo/i })).not.toBeInTheDocument();

		readAsDataURLSpy.mockRestore();
	});
});
