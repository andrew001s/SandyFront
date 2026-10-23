'use client';

import { type SettingsUpdate, TTS_PROVIDER, saveSettings } from '@/api/settings';
import { FeatureFlagsSkeleton } from '@/components/loading/dashboard-skeletons';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
	DEFAULT_FEATURE_FLAGS,
	FEATURE_FLAG_KEYS,
	FEATURE_FLAG_LABELS,
	type FeatureFlagKey,
	type FeatureFlags,
} from '@/lib/feature-flags';
import { cn } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import {
	Gift,
	type LucideIcon,
	MessageCircle,
	PartyPopper,
	Save,
	ShieldCheck,
	Sliders,
	Volume2,
	Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const FEATURE_FLAG_ICONS: Record<FeatureFlagKey, LucideIcon> = {
	chat_replies: MessageCircle,
	voice_replies: Volume2,
	events: PartyPopper,
	rewards: Gift,
	moderation: ShieldCheck,
	assist: Wand2,
};

export function FeatureFlagsPanel() {
	const { getToken } = useAuth();
	const { settings, isLoading: settingsLoading, refreshSettings } = useAppSettings();
	const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS });
	const [hasLocalChanges, setHasLocalChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (hasLocalChanges || !settings?.feature_flags) {
			return;
		}
		setFlags((current) => {
			const next = { ...current };
			for (const key of FEATURE_FLAG_KEYS) {
				const value = settings.feature_flags?.[key];
				if (typeof value === 'boolean') {
					next[key] = value;
				}
			}
			return next;
		});
	}, [hasLocalChanges, settings]);

	const handleToggle = (key: FeatureFlagKey) => {
		setFlags((current) => ({
			...current,
			[key]: !current[key],
		}));
		setHasLocalChanges(true);
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			const token = await getToken();
			const payload: SettingsUpdate = {
				...settings,
				tts_provider: TTS_PROVIDER,
				feature_flags: flags,
			};
			await saveSettings(payload, { token });
			await refreshSettings();
			setHasLocalChanges(false);
			toast.success('Módulos de emisión guardados');
		} catch (error) {
			console.error('Error al guardar funciones:', error);
			toast.error('No se pudieron guardar los módulos');
		} finally {
			setIsSaving(false);
		}
	};

	if (settingsLoading) {
		return <FeatureFlagsSkeleton />;
	}

	return (
		<div className='overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all'>
			<div className='flex flex-col gap-3 border-border border-b bg-card/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
				<div className='flex items-center gap-2.5'>
					<span className='flex size-8 items-center justify-center rounded-lg border border-border bg-background text-primary'>
						<Sliders size={15} />
					</span>
					<div>
						<h3 className='font-display font-semibold text-foreground text-sm'>
							Módulos de Emisión
						</h3>
						<p className='font-sans text-[11px] text-muted-foreground'>
							Habilita o deshabilita la reactividad de tu VTuber en directo.
						</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					{hasLocalChanges && (
						<span className='font-mono text-[11px] text-amber-500'>Cambios sin guardar</span>
					)}
					<Button
						type='button'
						onClick={handleSave}
						disabled={isSaving}
						className='h-8 gap-1.5 rounded-lg bg-primary px-3.5 font-sans font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90'
					>
						<Save size={13} />
						<span>{isSaving ? 'Guardando...' : 'Guardar módulos'}</span>
					</Button>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-2.5 p-3.5 sm:grid-cols-3 sm:gap-3 sm:p-5'>
				{FEATURE_FLAG_KEYS.map((key) => {
					const active = flags[key];
					const Icon = FEATURE_FLAG_ICONS[key];
					return (
						<button
							key={key}
							type='button'
							onClick={() => handleToggle(key)}
							className={cn(
								'group relative flex select-none flex-col justify-between rounded-xl border p-3.5 text-left outline-none transition-all duration-150',
								active
									? 'border-primary/40 bg-card shadow-xs hover:border-primary/60'
									: 'border-border/70 bg-background/50 hover:border-border hover:bg-card',
							)}
						>
							<div className='flex items-center justify-between'>
								<span
									className={cn(
										'flex size-8 items-center justify-center rounded-lg border transition-colors',
										active
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-border bg-background text-muted-foreground',
									)}
								>
									<Icon size={16} />
								</span>
								<span
									className={cn(
										'flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
										active
											? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
											: 'border-border bg-background text-muted-foreground/70',
									)}
								>
									<span
										className={cn(
											'size-1.5 rounded-full',
											active ? 'bg-emerald-400' : 'bg-muted-foreground/50',
										)}
									/>
									{active ? 'ON' : 'OFF'}
								</span>
							</div>

							<div className='mt-3'>
								<p className='font-display font-semibold text-foreground text-xs'>
									{FEATURE_FLAG_LABELS[key].label}
								</p>
								<p className='mt-0.5 line-clamp-2 font-sans text-[11px] text-muted-foreground leading-snug'>
									{FEATURE_FLAG_LABELS[key].description}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
