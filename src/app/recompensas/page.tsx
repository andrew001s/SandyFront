'use client';

import { type RewardConfig, getRewards, saveRewards } from '@/api/sandycore';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { Gift, Save, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SiKick, SiTwitch } from 'react-icons/si';
import { toast } from 'sonner';

export default function RecompensasPage() {
	const [rewards, setRewards] = useState<{ twitch: RewardConfig[]; kick: RewardConfig[] }>({
		twitch: [],
		kick: [],
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const loadData = async () => {
		setLoading(true);
		try {
			const data = await getRewards();
			setRewards(data);
		} catch (error) {
			console.error(error);
			toast.error('Error al cargar las recompensas del servidor');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	const handleToggle = (platform: 'twitch' | 'kick', rewardId: string, enabled: boolean) => {
		setRewards((prev) => ({
			...prev,
			[platform]: prev[platform].map((r) => (r.reward_id === rewardId ? { ...r, enabled } : r)),
		}));
	};

	const handlePromptChange = (platform: 'twitch' | 'kick', rewardId: string, prompt: string) => {
		setRewards((prev) => ({
			...prev,
			[platform]: prev[platform].map((r) => (r.reward_id === rewardId ? { ...r, prompt } : r)),
		}));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const allRewards = [...rewards.twitch, ...rewards.kick];
			await saveRewards(allRewards);
			toast.success('Configuración de recompensas guardada');
		} catch (error) {
			console.error(error);
			toast.error('Error al guardar la configuración de recompensas');
		} finally {
			setSaving(false);
		}
	};

	const renderSkeleton = () => (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
			{[1, 2, 3].map((n) => (
				<div key={n} className='space-y-3 rounded-xl border border-border bg-card p-5'>
					<div className='flex items-center justify-between'>
						<Skeleton className='h-5 w-20 rounded-md' />
						<Skeleton className='h-5 w-10 rounded-full' />
					</div>
					<Skeleton className='h-6 w-3/4' />
					<Skeleton className='h-20 w-full rounded-lg' />
				</div>
			))}
		</div>
	);

	const renderRewardCard = (reward: RewardConfig, platform: 'twitch' | 'kick') => {
		const isTwitch = platform === 'twitch';

		return (
			<div
				key={reward.reward_id}
				className={`flex flex-col justify-between rounded-xl border p-5 transition-all duration-150 ${
					reward.enabled
						? 'border-primary/50 bg-card shadow-xs'
						: 'border-border/80 bg-card hover:border-border'
				}`}
			>
				<div>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-2.5'>
							{reward.image_url ? (
								<Image
									src={reward.image_url}
									alt={reward.title}
									width={32}
									height={32}
									className='size-8 rounded-lg border border-border/80 bg-muted/40 object-contain p-0.5'
								/>
							) : (
								<div className='flex size-8 items-center justify-center rounded-lg border border-border/80 bg-muted/50'>
									<Gift
										className={`size-4 ${isTwitch ? 'text-[#9146FF]' : 'text-emerald-600 dark:text-[#53FC18]'}`}
									/>
								</div>
							)}
							<span className='rounded-md border border-border/90 bg-muted/60 px-2 py-0.5 font-medium font-mono text-[11px] text-foreground'>
								{reward.cost.toLocaleString()} pts
							</span>
						</div>

						<div className='flex items-center gap-2'>
							<span
								className={
									reward.enabled
										? 'font-mono font-semibold text-[10px] text-emerald-600 uppercase tracking-wider dark:text-emerald-400'
										: 'font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-wider'
								}
							>
								{reward.enabled ? 'Activo' : 'Inactivo'}
							</span>
							<Switch
								checked={reward.enabled}
								onCheckedChange={(checked) => handleToggle(platform, reward.reward_id, checked)}
							/>
						</div>
					</div>

					<div className='mt-3.5'>
						<h3 className='line-clamp-1 font-display font-semibold text-foreground text-sm'>
							{reward.title}
						</h3>
					</div>
				</div>

				<div className='mt-4'>
					{reward.enabled ? (
						<div className='space-y-1.5'>
							<div className='flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider'>
								<Sparkles className='size-3 text-primary' />
								<span>Instrucción de reacción para Sandy:</span>
							</div>
							<textarea
								value={reward.prompt}
								onChange={(e) => handlePromptChange(platform, reward.reward_id, e.target.value)}
								placeholder='Ej: Reacciona con sorpresa y agradece efusivamente el apoyo...'
								rows={3}
								className='w-full resize-none rounded-lg border border-border/90 bg-background p-2.5 font-sans text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
							/>
						</div>
					) : (
						<div className='flex items-center justify-center rounded-lg border border-border/80 border-dashed bg-muted/30 px-3 py-4 text-center font-medium font-sans text-muted-foreground text-xs'>
							Activa este canje para asignarle una reacción
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
				<PageHeader
					tag='Puntos de Canal · Reacciones en Vivo'
					title='Recompensas de Stream'
					description='Personaliza los prompts y activa a qué canjes de puntos de canal reaccionará Sandy en directo.'
				>
					<Button
						onClick={() => void handleSave()}
						disabled={loading || saving}
						className='flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-sans font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90 disabled:opacity-50'
					>
						<Save className='size-3.5' />
						<span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
					</Button>
				</PageHeader>

				{loading ? (
					renderSkeleton()
				) : (
					<Tabs defaultValue='twitch' className='space-y-5'>
						<TabsList className='grid w-full max-w-xs grid-cols-2 rounded-lg border border-border bg-card p-1'>
							<TabsTrigger
								value='twitch'
								className='flex items-center gap-2 rounded-md font-sans font-semibold text-xs'
							>
								<SiTwitch className='size-3.5 text-[#9146FF]' />
								Twitch
							</TabsTrigger>
							<TabsTrigger
								value='kick'
								className='flex items-center gap-2 rounded-md font-sans font-semibold text-xs'
							>
								<SiKick className='size-3.5 text-[#53FC18]' />
								Kick
							</TabsTrigger>
						</TabsList>

						<TabsContent value='twitch' className='space-y-4'>
							{rewards.twitch.length > 0 ? (
								<div className='grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3'>
									{rewards.twitch.map((reward) => renderRewardCard(reward, 'twitch'))}
								</div>
							) : (
								<div className='flex flex-col items-center justify-center rounded-xl border border-border/70 border-dashed bg-card/40 p-10 text-center'>
									<Gift className='mb-3 size-10 text-muted-foreground/50' />
									<h3 className='font-display font-semibold text-base text-foreground'>
										No se encontraron recompensas de Twitch
									</h3>
									<p className='mt-1 max-w-sm font-sans text-muted-foreground text-xs'>
										Crea recompensas de puntos de canal en tu panel de creador de Twitch y asegúrate
										de tener la cuenta vinculada.
									</p>
								</div>
							)}
						</TabsContent>

						<TabsContent value='kick' className='space-y-4'>
							{rewards.kick.length > 0 ? (
								<div className='grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3'>
									{rewards.kick.map((reward) => renderRewardCard(reward, 'kick'))}
								</div>
							) : (
								<div className='flex flex-col items-center justify-center rounded-xl border border-border/70 border-dashed bg-card/40 p-10 text-center'>
									<Gift className='mb-3 size-10 text-muted-foreground/50' />
									<h3 className='font-display font-semibold text-base text-foreground'>
										No se encontraron recompensas de Kick
									</h3>
									<p className='mt-1 max-w-sm font-sans text-muted-foreground text-xs'>
										Las recompensas en Kick requieren estatus de afiliado y configuración previa en
										tu canal.
									</p>
								</div>
							)}
						</TabsContent>
					</Tabs>
				)}
			</div>
		</DashboardShell>
	);
}
