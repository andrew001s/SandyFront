'use client';

import {
	type FishAudioModel,
	buildFishAudioCoverImageProxySrc,
	getFishAudioModel,
} from '@/api/fetchFishModels';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type FishVoicePreviewCardProps = {
	apiKey: string;
	voiceId: string;
	onClick?: () => void;
};

function formatFishMinutes(samples?: FishAudioModel['samples']) {
	const totalMs = samples?.reduce((sum, sample) => sum + (sample.duration_ms ?? 0), 0) ?? 0;

	if (totalMs <= 0) {
		return null;
	}

	const totalMinutes = Math.max(1, Math.round(totalMs / 60000));
	return `${totalMinutes.toLocaleString('es-ES')} minutos`;
}

function FishVoicePreviewSkeleton() {
	return (
		<div className='overflow-hidden rounded-2xl border border-border/60 bg-card'>
			<div className='grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]'>
				<div className='relative min-h-[180px] overflow-hidden'>
					<Skeleton className='size-full rounded-none' />
				</div>
				<div className='space-y-3 p-4'>
					<Skeleton className='h-4 w-2/3 rounded-full' />
					<Skeleton className='h-3 w-1/2 rounded-full' />
					<Skeleton className='h-3 w-full rounded-full' />
					<Skeleton className='h-3 w-4/5 rounded-full' />
					<div className='flex gap-2 pt-2'>
						<Skeleton className='h-6 w-20 rounded-full' />
						<Skeleton className='h-6 w-24 rounded-full' />
					</div>
				</div>
			</div>
		</div>
	);
}

export function FishVoicePreviewCard({ apiKey, voiceId, onClick }: FishVoicePreviewCardProps) {
	const [model, setModel] = useState<FishAudioModel | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const trimmedApiKey = apiKey.trim();
		const trimmedVoiceId = voiceId.trim();

		if (!trimmedApiKey || !trimmedVoiceId) {
			setModel(null);
			setError(null);
			setIsLoading(false);
			return;
		}

		let isActive = true;
		setIsLoading(true);
		setError(null);

		const timeoutId = window.setTimeout(() => {
			void getFishAudioModel({ apiKey: trimmedApiKey, voiceId: trimmedVoiceId })
				.then((nextModel) => {
					if (!isActive) {
						return;
					}

					setModel(nextModel);
					setError(null);
				})
				.catch((previewError) => {
					if (!isActive) {
						return;
					}

					console.error('Error cargando preview de Fish Audio:', previewError);
					setModel(null);
					setError('No pudimos cargar la preview de esta voz.');
				})
				.finally(() => {
					if (isActive) {
						setIsLoading(false);
					}
				});
		}, 350);

		return () => {
			isActive = false;
			window.clearTimeout(timeoutId);
		};
	}, [apiKey, voiceId]);

	const thumbnailUrl = model ? buildFishAudioCoverImageProxySrc(model.cover_image) : null;
	const durationLabel = formatFishMinutes(model?.samples);
	const fallbackLabel = model?.title?.charAt(0).toUpperCase() ?? 'V';
	const authorLabel = model?.author?.nickname?.trim() ?? 'Fish Audio';
	const hasVoiceId = Boolean(voiceId.trim());
	const previewPrompt = hasVoiceId ? 'Clic para cambiar la voz' : 'Clic aquí para buscar voces';
	const previewSubtext = hasVoiceId
		? (error ?? 'Si quieres cambiarla, abre el buscador.')
		: 'Abre el buscador para encontrar una voz y verla aquí.';

	return (
		<button
			type='button'
			onClick={onClick}
			disabled={!onClick}
			className={cn('group w-full text-left', onClick ? 'cursor-pointer' : 'cursor-default')}
		>
			<div className='space-y-3'>
				<div className='flex items-center justify-between gap-3'>
					<div className='space-y-0.5'>
						<p className='font-medium text-sm'>Vista previa de la voz</p>
					</div>
				</div>

				{isLoading ? (
					<FishVoicePreviewSkeleton />
				) : model ? (
					<div
						className={cn(
							'relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-200',
							onClick
								? 'group-hover:-translate-y-0.5 group-hover:border-violet-500/30 group-hover:bg-violet-500/5 group-hover:shadow-lg group-hover:shadow-violet-500/10'
								: '',
						)}
					>
						{onClick && hasVoiceId ? (
							<div className='absolute inset-0 z-10 flex items-center justify-center bg-black/55 px-4 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100'>
								<span className='rounded-full border border-violet-400/40 bg-violet-500/20 px-4 py-1.5 font-medium text-sm text-white shadow-lg'>
									Clic para cambiar la voz
								</span>
							</div>
						) : null}
						<div className='grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]'>
							<div className='relative min-h-[180px] overflow-hidden'>
								{thumbnailUrl ? (
									<Image
										src={thumbnailUrl}
										alt={model.title}
										unoptimized
										fill
										sizes='(max-width: 640px) 92vw, 160px'
										className='object-cover transition-transform duration-500 group-hover:scale-105'
									/>
								) : (
									<div className='flex size-full items-center justify-center bg-gradient-to-br from-violet-500/30 via-background to-emerald-500/20'>
										<span className='font-bold text-5xl text-violet-100/90'>{fallbackLabel}</span>
									</div>
								)}

								<div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent' />

								<div className='absolute right-2.5 bottom-2.5 left-2.5 space-y-0.5 text-white sm:hidden'>
									<p className='truncate font-semibold text-sm leading-tight'>{model.title}</p>
									<div className='flex items-center justify-between gap-2 text-white/80 text-xs'>
										<span className='truncate'>{authorLabel}</span>
										{durationLabel ? <span className='shrink-0'>{durationLabel}</span> : null}
									</div>
								</div>
							</div>

							<div className='flex min-w-0 flex-col justify-between gap-3 p-4'>
								<div className='space-y-2'>
									<div className='space-y-1'>
										<p className='truncate font-semibold text-base leading-tight'>{model.title}</p>
										<p className='truncate text-muted-foreground text-sm'>{authorLabel}</p>
									</div>

									{model.description ? (
										<p className='line-clamp-3 text-muted-foreground text-sm'>
											{model.description}
										</p>
									) : null}
								</div>

								<div className='flex flex-wrap items-center gap-2 text-xs'>
									{durationLabel ? (
										<span className='rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-muted-foreground'>
											{durationLabel}
										</span>
									) : null}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div
						className={cn(
							'relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-200',
							onClick
								? 'group-hover:-translate-y-0.5 group-hover:border-violet-500/30 group-hover:bg-violet-500/5 group-hover:shadow-lg group-hover:shadow-violet-500/10'
								: '',
						)}
					>
						{onClick && hasVoiceId ? (
							<div className='absolute inset-0 z-10 flex items-center justify-center bg-black/55 px-4 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100'>
								<span className='rounded-full border border-violet-400/40 bg-violet-500/20 px-4 py-1.5 font-medium text-sm text-white shadow-lg'>
									Clic para cambiar la voz
								</span>
							</div>
						) : null}
						<div className='grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]'>
							<div className='flex min-h-[180px] items-center justify-center bg-gradient-to-br from-violet-500/15 via-background to-emerald-500/10 p-4'>
								<div className='flex size-16 items-center justify-center rounded-full border border-border/70 bg-background/90 text-violet-500 shadow-sm'>
									<Sparkles className='size-6' />
								</div>
							</div>

							<div className='flex min-w-0 flex-col justify-center gap-3 p-4'>
								<div className='space-y-1'>
									<p className='font-semibold text-base leading-tight'>{previewPrompt}</p>
									<p className='text-muted-foreground text-sm'>{previewSubtext}</p>
								</div>

								<div className='flex flex-wrap items-center gap-2 text-xs'>
									<span className='rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-muted-foreground'>
										Preview
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</button>
	);
}
