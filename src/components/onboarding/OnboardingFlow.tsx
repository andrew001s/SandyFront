'use client';

import { type SettingsPayload, getSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import {
	getOnboardingPersistenceKey,
	isOnboardingComplete,
	markOnboardingComplete,
} from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { OnboardingProvider } from '@onboardjs/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OnboardingShell } from './OnboardingShell';
import type { OnboardingFlowData, SandyOnboardingContext } from './onboarding.types';
import { steps } from './onboardingSteps';

export function onboardingDataFromSettings(settings: SettingsPayload): OnboardingFlowData {
	return {
		aiProvider: settings.ai_provider,
		geminiApiKey: settings.gemini_api_key,
		openrouterApiKey: settings.openrouter_api_key,
		openrouterModel: settings.openrouter_model,
		localApiUrl: settings.local_api_url,
		localModel: settings.local_model,
		fishAudioKey: settings.fish_audio_key,
		voiceId: settings.voice_id,
		ttsProvider:
			settings.tts_provider === 'fish_audio' ||
			settings.tts_provider === 'local_tts' ||
			settings.tts_provider === 'edge_tts'
				? settings.tts_provider
				: undefined,
		sttProvider:
			settings.stt_provider === 'browser' || settings.stt_provider === 'azure'
				? settings.stt_provider
				: undefined,
		azureSpeechKey: settings.azure_speech_key,
		azureRegion: settings.azure_region,
		language: settings.language,
		personaProfile: settings.persona_profile,
	};
}

export function OnboardingFlow() {
	const router = useRouter();
	const { isLoaded, isSignedIn, userId, getToken } = useAuth();
	const [loaded, setLoaded] = useState<{ owner: string; data: OnboardingFlowData } | null>(null);
	const [error, setError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		if (!isLoaded || !isSignedIn || !userId) return;
		if (isOnboardingComplete(userId)) {
			router.replace('/avatar');
			return;
		}
		let cancelled = false;
		setError(false);
		void (async () => {
			try {
				const result = await getSettings({ token: await getToken() });
				if (cancelled) return;
				if (result.settings?.onboarding_completed) {
					markOnboardingComplete(userId);
					router.replace('/avatar');
					return;
				}
				setLoaded({ owner: userId, data: onboardingDataFromSettings(result.settings ?? {}) });
			} catch {
				if (!cancelled) setError(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isLoaded, isSignedIn, userId, getToken, router, attempt]);
	if (error)
		return (
			<div className='mx-auto max-w-lg space-y-4 px-5 py-16'>
				<p role='alert'>
					No se pudo cargar tu configuración guardada. Reintenta para continuar con tus datos.
				</p>
				<Button type='button' className='min-h-11' onClick={() => setAttempt((value) => value + 1)}>
					Reintentar carga
				</Button>
			</div>
		);
	if (!isLoaded || !isSignedIn || loaded?.owner !== userId)
		return (
			<div
				aria-live='polite'
				className='flex min-h-dvh items-center justify-center px-5 text-muted-foreground'
			>
				Cargando tu configuración inicial...
			</div>
		);
	return (
		<OnboardingProvider<SandyOnboardingContext>
			key={userId}
			steps={steps}
			initialContext={{ flowData: loaded.data }}
			localStoragePersistence={{ key: getOnboardingPersistenceKey(userId) }}
			flowId='sandy-vtuber-setup'
			flowName='Configuración inicial de Sandy Studio'
		>
			<OnboardingShell />
		</OnboardingProvider>
	);
}
