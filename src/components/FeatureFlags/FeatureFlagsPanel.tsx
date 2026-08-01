'use client';

import { type SettingsPayload, saveSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
	DEFAULT_FEATURE_FLAGS,
	FEATURE_FLAG_KEYS,
	FEATURE_FLAG_LABELS,
	type FeatureFlagKey,
	type FeatureFlags,
} from '@/lib/sandycore-config';
import { cn } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import {
	Gift,
	type LucideIcon,
	MessageCircle,
	PartyPopper,
	Save,
	ShieldCheck,
	ToggleRight,
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
	const { settings, refreshSettings } = useAppSettings();
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
			const payload: SettingsPayload = {
				...settings,
				feature_flags: flags,
			};
			await saveSettings(payload, { token });
			await refreshSettings();
			setHasLocalChanges(false);
			toast.success('Funciones guardadas');
		} catch (error) {
			console.error('Error al guardar funciones:', error);
			toast.error('No se pudieron guardar las funciones');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card className='border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl'>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex min-w-0 items-start gap-4'>
						<div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-violet-600 shadow-sm'>
							<ToggleRight className='size-5' />
						</div>
						<div className='space-y-1'>
							<CardTitle className='text-xl'>Funciones activables</CardTitle>
							<CardDescription className='max-w-xl'>
								Activa o desactiva los módulos de tu VTuber.
							</CardDescription>
						</div>
					</div>
					<Button
						type='button'
						onClick={handleSave}
						disabled={isSaving}
						className='bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
					>
						<Save className='size-4' />
						{isSaving ? 'Guardando...' : 'Guardar'}
					</Button>
				</div>
			</CardHeader>
			<CardContent className='grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6'>
				{FEATURE_FLAG_KEYS.map((key) => {
					const active = flags[key];
					const Icon = FEATURE_FLAG_ICONS[key];
					return (
						<button
							key={key}
							type='button'
							onClick={() => handleToggle(key)}
							className={cn(
								'group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border p-5 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-violet-500/50',
								active
									? 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50 hover:bg-violet-500/10'
									: 'border-border/60 bg-background/60 hover:border-border hover:bg-accent/50',
							)}
						>
							<div
								className='pointer-events-none absolute inset-0 opacity-60'
								style={{
									backgroundImage:
										'linear-gradient(to right, rgba(139,92,246,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.08) 1px, transparent 1px)',
									backgroundSize: '18px 18px',
								}}
							/>
							<span
								className={cn(
									'absolute top-3 right-3 flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
									active
										? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
										: 'border-border/70 bg-background/80 text-muted-foreground',
								)}
							>
								<span
									className={cn(
										'size-1.5 rounded-full',
										active
											? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]'
											: 'bg-muted-foreground',
									)}
								/>
								{active ? 'Activo' : 'Inactivo'}
							</span>
							<div
								className={cn(
									'mt-5 flex size-12 items-center justify-center rounded-2xl border shadow-sm transition-colors',
									active
										? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'
										: 'border-border/70 bg-background/80 text-muted-foreground',
								)}
							>
								<Icon className='size-6' />
							</div>
							<div className='relative z-10'>
								<p className='font-medium text-sm'>{FEATURE_FLAG_LABELS[key].label}</p>
								<p className='text-muted-foreground text-xs'>
									{FEATURE_FLAG_LABELS[key].description}
								</p>
							</div>
						</button>
					);
				})}
			</CardContent>
		</Card>
	);
}
