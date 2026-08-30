'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Gift, Save, Star, Sparkles } from 'lucide-react';
import { SiKick, SiTwitch } from 'react-icons/si';

import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getRewards, saveRewards, type RewardConfig } from '@/api/sandycore';
import Image from 'next/image';

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
		loadData();
	}, []);

	const handleToggle = (platform: 'twitch' | 'kick', rewardId: string, enabled: boolean) => {
		setRewards((prev) => ({
			...prev,
			[platform]: prev[platform].map((r) =>
				r.reward_id === rewardId ? { ...r, enabled } : r
			),
		}));
	};

	const handlePromptChange = (platform: 'twitch' | 'kick', rewardId: string, prompt: string) => {
		setRewards((prev) => ({
			...prev,
			[platform]: prev[platform].map((r) =>
				r.reward_id === rewardId ? { ...r, prompt } : r
			),
		}));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const allRewards = [...rewards.twitch, ...rewards.kick];
			await saveRewards(allRewards);
			toast.success('Configuración de recompensas guardada correctamente');
		} catch (error) {
			console.error(error);
			toast.error('Error al guardar la configuración de recompensas');
		} finally {
			setSaving(false);
		}
	};

	const renderSkeleton = () => (
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
			{[1, 2, 3].map((n) => (
				<Card key={n} className='overflow-hidden border-border/40 bg-background/50'>
					<CardHeader className='space-y-2 p-6'>
						<div className='flex items-center justify-between'>
							<Skeleton className='h-6 w-24 rounded-full' />
							<Skeleton className='h-6 w-12 rounded-full' />
						</div>
						<Skeleton className='h-8 w-3/4' />
					</CardHeader>
					<CardContent className='space-y-4 p-6 pt-0'>
						<Skeleton className='h-24 w-full rounded-xl' />
					</CardContent>
				</Card>
			))}
		</div>
	);

	const renderRewardCard = (reward: RewardConfig, platform: 'twitch' | 'kick') => {
		const isTwitch = platform === 'twitch';
		const themeColor = isTwitch ? 'border-[#9146FF]/30' : 'border-[#53FC18]/30';
		const activeThemeColor = isTwitch ? 'ring-[#9146FF]/50 border-[#9146FF]' : 'ring-[#53FC18]/50 border-[#53FC18]';
		
		return (
			<Card
				key={reward.reward_id}
				className={`relative overflow-hidden border bg-background/50 backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${
					reward.enabled ? `shadow-sm ${activeThemeColor}` : `border-border/40 ${themeColor}`
				}`}
			>
				<div 
					className='absolute top-0 left-0 h-[3px] w-full' 
					style={{ backgroundColor: reward.background_color || (isTwitch ? '#9146FF' : '#53FC18') }}
				/>
				
				<CardHeader className='space-y-4 p-5'>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-2'>
							{reward.image_url ? (
								<Image 
									src={reward.image_url} 
									alt={reward.title} 
									className='size-8 rounded-lg border border-border/40 bg-background/80 object-contain p-0.5 shadow-sm'
								/>
							) : (
								<div className='flex size-8 items-center justify-center rounded-lg border border-border/40 bg-background/80 shadow-sm'>
									<Gift className={`size-4 ${isTwitch ? 'text-[#9146FF]' : 'text-[#53FC18]'}`} />
								</div>
							)}
							<Badge variant="secondary" className='px-2.5 py-0.5 font-semibold text-xs'>
								{reward.cost.toLocaleString()} Pts
							</Badge>
						</div>
						
						<div className="flex items-center gap-2">
							<span className='font-medium text-muted-foreground text-xs'>
								{reward.enabled ? 'Habilitado' : 'Apagado'}
							</span>
							<Switch
								checked={reward.enabled}
								onCheckedChange={(checked) => handleToggle(platform, reward.reward_id, checked)}
								className="data-[state=checked]:bg-violet-600 dark:data-[state=checked]:bg-[#9146FF]"
							/>
						</div>
					</div>
					
					<div>
						<CardTitle className='line-clamp-1 font-semibold text-lg leading-tight tracking-tight'>
							{reward.title}
						</CardTitle>
					</div>
				</CardHeader>
				
				<CardContent className='space-y-4 p-5 pt-0'>
					{reward.enabled ? (
						<div className='fade-in slide-in-from-top-2 animate-in space-y-2 duration-300'>
							<div className='flex items-center gap-1.5 font-medium text-muted-foreground text-xs'>
								<Sparkles className="size-3.5 text-amber-500" />
								<span>Prompt de reacción para Sandy:</span>
							</div>
							<textarea
								value={reward.prompt}
								onChange={(e) => handlePromptChange(platform, reward.reward_id, e.target.value)}
								placeholder="Ej. Reacciona muy emocionada y dile que es el mejor viewer..."
								rows={3}
								className='w-full resize-none rounded-xl border border-border/60 bg-background/60 p-3 font-medium text-sm shadow-inner transition-all placeholder:text-muted-foreground/60 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
							/>
						</div>
					) : (
						<div className='flex items-center justify-center rounded-xl border border-border/40 border-dashed bg-background/30 py-6 font-medium text-muted-foreground/70 text-xs'>
							Activa la recompensa para personalizar la reacción de Sandy
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
				<header className='mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
					<div>
						<h1 className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
							<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
								Recompensas
							</span>
							<span className='ml-3 inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]'>
								<Star size={22} className='fill-amber-400 dark:fill-[#FDE68A]' />
							</span>
						</h1>
						<p className='mt-2 max-w-xl text-muted-foreground'>
							Personaliza los prompts y activa a qué recompensas de puntos de canal reaccionará Sandy en directo.
						</p>
					</div>

					<div>
						<Button
							onClick={handleSave}
							disabled={loading || saving}
							className='flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white shadow-md duration-300 hover:bg-violet-700 active:scale-95 disabled:opacity-50'
						>
							<Save className="size-4" />
							{saving ? 'Guardando...' : 'Guardar cambios'}
						</Button>
					</div>
				</header>

				{loading ? (
					renderSkeleton()
				) : (
					<Tabs defaultValue="twitch" className="space-y-6">
						<TabsList className='grid w-full max-w-xs grid-cols-2 rounded-xl border border-border/40 bg-background/80 p-1'>
							<TabsTrigger value="twitch" className='flex items-center gap-2 rounded-lg font-semibold'>
								<SiTwitch className="size-4 text-[#9146FF]" />
								Twitch
							</TabsTrigger>
							<TabsTrigger value="kick" className='flex items-center gap-2 rounded-lg font-semibold'>
								<SiKick className="size-4 text-[#53FC18]" />
								Kick
							</TabsTrigger>
						</TabsList>

						<TabsContent value="twitch" className="space-y-6">
							{rewards.twitch.length > 0 ? (
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
									{rewards.twitch.map((reward) => renderRewardCard(reward, 'twitch'))}
								</div>
							) : (
								<div className='flex flex-col items-center justify-center rounded-3xl border border-border/60 border-dashed bg-background/25 p-12 text-center'>
									<Gift className='mb-4 size-12 animate-[bounce_2s_infinite] text-muted-foreground/60' />
									<h3 className="font-semibold text-lg">No se encontraron recompensas</h3>
									<p className='mt-1.5 max-w-sm text-muted-foreground'>
										Asegúrate de tener recompensas personalizadas creadas en tu canal de Twitch y de tener la cuenta vinculada.
									</p>
								</div>
							)}
						</TabsContent>

						<TabsContent value="kick" className="space-y-6">
							{rewards.kick.length > 0 ? (
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
									{rewards.kick.map((reward) => renderRewardCard(reward, 'kick'))}
								</div>
							) : (
								<div className='flex flex-col items-center justify-center rounded-3xl border border-border/60 border-dashed bg-background/25 p-12 text-center'>
									<Gift className='mb-4 size-12 animate-[bounce_2s_infinite] text-muted-foreground/60' />
									<h3 className="font-semibold text-lg">No se encontraron recompensas</h3>
									<p className='mt-1.5 max-w-sm text-muted-foreground'>
										Actualmente no hay recompensas detectadas de Kick. Recuerda que esta función requiere nivel de afiliado en Kick.
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
