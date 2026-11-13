import { OnboardingProvider } from '@onboardjs/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingShell } from './OnboardingShell';
import { steps } from './onboardingSteps';

const saveSettings = vi.hoisted(() => vi.fn());
vi.mock('@/api/settings', () => ({ saveSettings }));
vi.mock('@clerk/nextjs', () => ({
	useAuth: () => ({ userId: 'onboarding-test', getToken: async () => 'token' }),
}));
vi.mock('next/image', () => ({ default: () => <span>Sandy Studio</span> }));
vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => false }));

beforeEach(() => {
	saveSettings.mockReset();
	localStorage.clear();
	vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

function setup(step: string, flowData = {}) {
	return render(
		<OnboardingProvider steps={steps} initialStepId={step} initialContext={{ flowData }}>
			<OnboardingShell />
		</OnboardingProvider>,
	);
}

describe('onboarding navigation and recovery', () => {
	it('preserves a hydrated draft when a different field is edited after resuming', async () => {
		render(
			<OnboardingProvider
				steps={steps}
				initialContext={{ flowData: {} }}
				customOnDataLoad={async () => ({
					currentStepId: 'ai',
					flowData: {
						aiProvider: 'gemini',
						voiceId: 'retained-voice',
						geminiApiKey: 'earlier-key',
					},
				})}
			>
				<OnboardingShell />
			</OnboardingProvider>,
		);
		const field = await screen.findByLabelText('Clave de API de Gemini');
		expect(field).toHaveValue('earlier-key');
		fireEvent.change(field, { target: { value: 'updated-key' } });
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Guardar y seguir' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
		await screen.findByRole('heading', { name: 'Personalidad de la VTuber' });
		expect(saveSettings.mock.calls.at(-1)?.[0]).toMatchObject({
			ai_provider: 'gemini',
			gemini_api_key: 'updated-key',
			voice_id: 'retained-voice',
		});
	});

	it('uses the saved local AI URL when the account only returns the provider', async () => {
		localStorage.setItem('sandy_local_ai_url', 'http://localhost:11434');
		setup('ai', { aiProvider: 'local' });
		expect(await screen.findByLabelText('URL de la API')).toHaveValue('http://localhost:11434');
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Guardar y seguir' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
		expect(
			await screen.findByRole('heading', { name: 'Personalidad de la VTuber' }),
		).toBeInTheDocument();
		expect(saveSettings.mock.calls.at(-1)?.[0]).toMatchObject({
			ai_provider: 'local',
			local_api_url: 'http://localhost:11434',
		});
	});

	it('keeps the visible local voice defaults when resuming a provider saved on the account', async () => {
		setup('voice', { ttsProvider: 'local_tts' });
		expect(await screen.findByLabelText('URL del servidor de voz')).toHaveValue(
			'http://localhost:8020',
		);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Guardar y seguir' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
		expect(await screen.findByRole('heading', { name: 'Habla con Sandy' })).toBeInTheDocument();
	});

	it('requires AI data to continue but allows an explicit decision later', async () => {
		setup('ai');
		const field = await screen.findByLabelText('Clave de API de Gemini');
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Guardar y seguir' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('clave de API de Gemini');
		expect(field).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Decidir después' }));
		expect(
			await screen.findByRole('heading', { name: 'Personalidad de la VTuber' }),
		).toBeInTheDocument();
	});

	it('saves the default Gemini choice and stays on the same editable step after a failed save', async () => {
		saveSettings.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ settings: {} });
		setup('ai');
		const field = await screen.findByLabelText('Clave de API de Gemini');
		fireEvent.change(field, { target: { value: 'placeholder-key' } });
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Guardar y seguir' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
		expect(field).toHaveValue('placeholder-key');
		expect(saveSettings).toHaveBeenLastCalledWith(
			{ ai_provider: 'gemini', gemini_api_key: 'placeholder-key' },
			{ token: 'token' },
		);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
		expect(
			await screen.findByRole('heading', { name: 'Personalidad de la VTuber' }),
		).toBeInTheDocument();
	});

	it('shows pending tasks and keeps finalization available for retry after failure', async () => {
		saveSettings.mockRejectedValue(new Error('offline'));
		setup('completed');
		expect(await screen.findByText('Sin conexión comprobada')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Guardar y entrar al estudio' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('todavía no marcamos');
		expect(localStorage.getItem('sandy:onboarding:complete:onboarding-test')).toBeNull();
		expect(screen.getByRole('button', { name: 'Guardar y entrar al estudio' })).toBeEnabled();
		expect(saveSettings).toHaveBeenCalledWith({ onboarding_completed: true }, { token: 'token' });
	});
});
