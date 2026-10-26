'use client';

import { type RewardConfig, getRewards } from '@/api/sandycore';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { vrmManager } from '@/lib/avatar/vrmManager';
import {
	DEFAULT_VRM_SLIME_COLOR,
	VRM_TRIGGER_NAMES,
	type VrmDropObjectKind,
	type VrmTriggerAction,
	type VrmTriggerName,
	type VrmTriggerRule,
	addVrmTriggerRule,
	getVrmTriggerRules,
	saveVrmTriggerRules,
} from '@/lib/avatar/vrmTriggerGraph';
import { Check, ChevronDown, CircleHelp, Play, Plus, Radio, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
	onClose: () => void;
}

const TRIGGER_FILTER_DESCRIPTIONS: Record<
	Exclude<VrmTriggerName, 'channel_point_reward'>,
	string
> = {
	chat_message:
		'Compara el filtro de texto con el mensaje del chat. En «Más filtros» puedes exigir coincidencia exacta, distinguir mayúsculas o limitarlo a un usuario.',
	follow:
		'Compara el texto con el nombre de quien siguió el canal. Déjalo vacío para aceptar cualquier follow.',
	subscribe:
		'Compara el texto con el nombre de quien se suscribió. Déjalo vacío para aceptar cualquier suscripción.',
	subscription_message:
		'Compara el texto con el nombre del usuario y su mensaje de suscripción. Déjalo vacío para aceptar cualquiera.',
	sub_gift:
		'Compara el texto con el nombre de quien regaló la suscripción. Déjalo vacío para aceptar cualquier regalo.',
	cheer:
		'Compara el filtro de texto con el mensaje del cheer. En «Más filtros» puedes limitar por usuario y por cantidad mínima o máxima de bits.',
	raid: 'Compara el texto con el nombre del canal que hizo el raid. Déjalo vacío para aceptar cualquier raid.',
};

export function VrmStudioTriggersPanel({ onClose }: Props) {
	const [rules, setRules] = useState<VrmTriggerRule[]>(() => getVrmTriggerRules());
	const [channelRewards, setChannelRewards] = useState<RewardConfig[]>([]);
	const [channelRewardsLoading, setChannelRewardsLoading] = useState(true);
	const [rewardDialogRuleId, setRewardDialogRuleId] = useState<string | null>(null);
	const [rewardSearch, setRewardSearch] = useState('');

	useEffect(() => {
		let mounted = true;
		void getRewards()
			.then((data) => {
				if (mounted) setChannelRewards(data.twitch);
			})
			.catch((error) => {
				console.error('No se pudieron cargar las recompensas de Twitch:', error);
			})
			.finally(() => {
				if (mounted) setChannelRewardsLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, []);

	const update = (next: VrmTriggerRule[]) => {
		setRules(next);
		saveVrmTriggerRules(next);
	};

	const updateRule = (id: string, patch: Partial<VrmTriggerRule>) => {
		update(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
	};

	const updateAction = (id: string, action: VrmTriggerAction) => updateRule(id, { action });
	const updateThrowAction = (
		id: string,
		action: VrmTriggerAction,
		patch: Partial<Omit<Extract<VrmTriggerAction, { type: 'throw_object' }>, 'type'>>,
	) => {
		if (action.type === 'throw_object') updateAction(id, { ...action, ...patch });
	};
	const updateBoneAction = (
		id: string,
		action: VrmTriggerAction,
		patch: Partial<Omit<Extract<VrmTriggerAction, { type: 'bone_pose' }>, 'type'>>,
	) => {
		if (action.type === 'bone_pose') updateAction(id, { ...action, ...patch });
	};
	const updateBoneScaleAction = (
		id: string,
		action: VrmTriggerAction,
		patch: Partial<Omit<Extract<VrmTriggerAction, { type: 'bone_scale' }>, 'type'>>,
	) => {
		if (action.type === 'bone_scale') updateAction(id, { ...action, ...patch });
	};
	const updateEmojiRainAction = (
		id: string,
		action: VrmTriggerAction,
		patch: Partial<Omit<Extract<VrmTriggerAction, { type: 'emoji_rain' }>, 'type'>>,
	) => {
		if (action.type === 'emoji_rain') updateAction(id, { ...action, ...patch });
	};
	const setActionDuration = (id: string, action: VrmTriggerAction, durationSeconds: number) => {
		if (action.type === 'expression')
			updateAction(id, { type: 'expression', expression: action.expression, durationSeconds });
		if (action.type === 'idle')
			updateAction(id, { type: 'idle', enabled: action.enabled, durationSeconds });
	};
	const setActionEnabled = (id: string, action: VrmTriggerAction, enabled: boolean) => {
		if (action.type === 'idle')
			updateAction(id, { type: 'idle', enabled, durationSeconds: action.durationSeconds });
		if (action.type === 'slime') {
			updateAction(id, {
				type: 'slime',
				enabled,
				durationSeconds: action.durationSeconds,
				color: action.color,
			});
		}
	};
	const rewardDialogRule = rules.find((rule) => rule.id === rewardDialogRuleId);
	const filteredRewards = channelRewards.filter((reward) =>
		reward.title.toLocaleLowerCase().includes(rewardSearch.trim().toLocaleLowerCase()),
	);

	return (
		<>
			<section
				aria-label='Nodos activables del avatar'
				className='w-[22rem] max-w-[calc(100vw-3rem)] space-y-3 rounded-xl border border-border/80 bg-background/95 p-3.5 text-foreground shadow-xl backdrop-blur-md'
			>
				<header className='flex items-center justify-between border-border/60 border-b pb-2.5'>
					<div className='flex items-center gap-2'>
						<Radio aria-hidden='true' className='size-4 text-primary' />
						<div>
							<h2 className='font-bold font-display text-sm'>Nodos activables</h2>
							<p className='text-[11px] text-muted-foreground'>
								Evento de Twitch → acción del avatar
							</p>
						</div>
					</div>
					<Button
						aria-label='Cerrar nodos activables'
						onClick={onClose}
						size='icon'
						variant='ghost'
					>
						<X className='size-3.5' />
					</Button>
				</header>
				<p className='text-[11px] text-muted-foreground leading-relaxed'>
					Las reglas quedan en este navegador. Activa los servicios de Twitch Chat y EventSub en
					SandyCore para recibir sus eventos.
				</p>

				<div className='max-h-[55vh] space-y-2 overflow-y-auto pr-1'>
					{rules.length === 0 && (
						<p className='rounded-lg border border-border/70 border-dashed p-3 text-muted-foreground text-xs'>
							Añade una regla para conectar un evento de Twitch con una acción.
						</p>
					)}
					{rules.map((rule) => (
						<article
							className='space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2.5'
							key={rule.id}
						>
							<div className='flex items-center gap-2'>
								<input
									aria-label='Activar regla'
									checked={rule.enabled}
									className='size-4 accent-primary'
									onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })}
									type='checkbox'
								/>
								<div className='relative min-w-0 flex-1'>
									<select
										aria-label='Evento de Twitch'
										className='h-8 w-full appearance-none rounded-md border border-border bg-background py-1 pr-8 pl-2 text-xs'
										onChange={(event) => {
											const trigger = event.target.value as VrmTriggerName;
											updateRule(rule.id, {
												trigger,
												rewardId: trigger === 'channel_point_reward' ? rule.rewardId : undefined,
												contains: trigger === 'channel_point_reward' ? undefined : rule.contains,
											});
										}}
										value={rule.trigger}
									>
										{VRM_TRIGGER_NAMES.map((trigger) => (
											<option key={trigger.id} value={trigger.id}>
												{trigger.label}
											</option>
										))}
									</select>
									<ChevronDown
										aria-hidden='true'
										className='-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 size-3.5 text-muted-foreground'
									/>
								</div>
								<button
									aria-label='Eliminar regla'
									className='rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
									onClick={() => update(rules.filter((item) => item.id !== rule.id))}
									type='button'
								>
									<Trash2 className='size-3.5' />
								</button>
							</div>
							{rule.trigger === 'channel_point_reward' ? (
								<div className='space-y-1'>
									<span className='text-[10px] text-muted-foreground'>Recompensa de canal</span>
									<button
										className='flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 text-left text-xs transition-colors hover:border-primary/60'
										disabled={channelRewardsLoading}
										onClick={() => {
											setRewardSearch('');
											setRewardDialogRuleId(rule.id);
										}}
										type='button'
									>
										<span className='truncate text-foreground'>
											{rule.rewardId
												? (channelRewards.find((reward) => reward.reward_id === rule.rewardId)
														?.title ?? 'Recompensa guardada (no disponible)')
												: 'Todas las recompensas'}
										</span>
										<Search
											aria-hidden='true'
											className='size-3.5 shrink-0 text-muted-foreground'
										/>
									</button>
								</div>
							) : (
								<div className='flex items-center gap-1.5'>
									<input
										aria-label='Filtrar evento por texto'
										className='h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs'
										onChange={(event) => updateRule(rule.id, { contains: event.target.value })}
										placeholder='Filtro de texto (opcional)'
										value={rule.contains ?? ''}
									/>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												aria-label='Ayuda sobre el filtro de texto'
												className='rounded-full p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
												type='button'
											>
												<CircleHelp aria-hidden='true' className='size-4' />
											</button>
										</TooltipTrigger>
										<TooltipContent
											className='max-w-xs whitespace-normal leading-relaxed'
											side='top'
										>
											{
												TRIGGER_FILTER_DESCRIPTIONS[
													rule.trigger as Exclude<VrmTriggerName, 'channel_point_reward'>
												]
											}
										</TooltipContent>
									</Tooltip>
								</div>
							)}
							<details className='rounded-md border border-border/60 px-2 py-1.5'>
								<summary className='cursor-pointer text-[11px] text-muted-foreground'>
									Más filtros
								</summary>
								<div className='mt-2 grid grid-cols-2 gap-2'>
									<input
										aria-label='Filtrar por usuario'
										className='col-span-2 h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs'
										onChange={(event) => updateRule(rule.id, { userContains: event.target.value })}
										placeholder='Usuario contiene…'
										value={rule.userContains ?? ''}
									/>
									{rule.trigger !== 'channel_point_reward' && (
										<select
											aria-label='Tipo de coincidencia'
											className='h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs'
											onChange={(event) =>
												updateRule(rule.id, {
													matchMode: event.target.value as 'contains' | 'exact',
												})
											}
											value={rule.matchMode ?? 'contains'}
										>
											<option value='contains'>Texto contiene</option>
											<option value='exact'>Texto exacto</option>
										</select>
									)}
									{rule.trigger !== 'channel_point_reward' && (
										<label className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
											<input
												checked={rule.caseSensitive ?? false}
												className='size-3.5 accent-primary'
												onChange={(event) =>
													updateRule(rule.id, { caseSensitive: event.target.checked })
												}
												type='checkbox'
											/>
											Distinguir mayúsculas
										</label>
									)}
									{rule.trigger === 'cheer' && (
										<>
											<input
												aria-label='Bits mínimos'
												className='h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs'
												min={0}
												onChange={(event) =>
													updateRule(rule.id, {
														minAmount: event.target.value ? Number(event.target.value) : undefined,
													})
												}
												placeholder='Bits mínimos'
												type='number'
												value={rule.minAmount ?? ''}
											/>
											<input
												aria-label='Bits máximos'
												className='h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs'
												min={0}
												onChange={(event) =>
													updateRule(rule.id, {
														maxAmount: event.target.value ? Number(event.target.value) : undefined,
													})
												}
												placeholder='Bits máximos'
												type='number'
												value={rule.maxAmount ?? ''}
											/>
										</>
									)}
								</div>
							</details>
							{rule.trigger === 'channel_point_reward' &&
								!channelRewardsLoading &&
								!channelRewards.length && (
									<p className='text-[10px] text-muted-foreground'>
										Conecta Twitch para cargar tus recompensas de canal.
									</p>
								)}
							<div className='flex items-center gap-2'>
								<span className='shrink-0 text-[11px] text-muted-foreground'>Ejecutar</span>
								<div className='relative min-w-0 flex-1'>
									<select
										aria-label='Acción del nodo'
										className='h-8 w-full appearance-none rounded-md border border-border bg-background py-1 pr-8 pl-2 text-xs'
										onChange={(event) => {
											const type = event.target.value;
											if (type === 'expression')
												updateAction(rule.id, {
													type,
													expression: 'surprised',
													durationSeconds: 0,
												});
											else if (type === 'idle')
												updateAction(rule.id, { type, enabled: true, durationSeconds: 0 });
											else if (type === 'slime') {
												updateAction(rule.id, {
													type,
													enabled: true,
													durationSeconds: 10,
													color: DEFAULT_VRM_SLIME_COLOR,
												});
											} else if (type === 'throw_object') {
												updateAction(rule.id, { type, kind: 'random' });
											} else if (type === 'bone_pose') {
												updateAction(rule.id, {
													type,
													bone: 'head',
													rotation: 18,
													durationSeconds: 3,
												});
											} else if (type === 'bone_scale') {
												updateAction(rule.id, {
													type,
													bone: 'head',
													scale: 1.15,
													durationSeconds: 3,
												});
											} else if (type === 'emoji_rain') {
												updateAction(rule.id, {
													type,
													amount: 16,
													radius: 0.8,
													size: 0.2,
													gravity: 1.4,
													durationSeconds: 6,
												});
											}
										}}
										value={rule.action.type}
									>
										<option value='throw_object'>Lanzar objeto</option>
										<option value='expression'>Activar expresión</option>
										<option value='idle'>Activar idle</option>
										<option value='slime'>Activar slime</option>
										<option value='bone_pose'>Rotar hueso</option>
										<option value='bone_scale'>Escalar hueso</option>
										<option value='emoji_rain'>Lluvia de emotes</option>
									</select>
									<ChevronDown
										aria-hidden='true'
										className='-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 size-3.5 text-muted-foreground'
									/>
								</div>
							</div>
							{rule.action.type === 'expression' && (
								<div className='space-y-2'>
									<div className='relative min-w-0 flex-1'>
										<select
											aria-label='Expresión'
											className='h-8 w-full appearance-none rounded-md border border-border bg-background py-1 pr-8 pl-2 text-xs'
											onChange={(event) =>
												updateAction(rule.id, {
													type: 'expression',
													expression: event.target.value,
												})
											}
											value={rule.action.expression}
										>
											{vrmManager.getAvailableExpressions().map((expression) => (
												<option key={expression}>{expression}</option>
											))}
											{!vrmManager.getAvailableExpressions().length && (
												<option value='surprised'>surprised</option>
											)}
										</select>
										<ChevronDown
											aria-hidden='true'
											className='-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 size-3.5 text-muted-foreground'
										/>
									</div>
									<label className='flex items-center justify-between gap-2 text-muted-foreground text-xs'>
										<span>Volver a neutral (0 = manual)</span>
										<input
											aria-label='Segundos para volver la expresión a neutral'
											className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
											max={300}
											min={0}
											onChange={(event) => {
												const durationSeconds = Number(event.target.value);
												setActionDuration(
													rule.id,
													rule.action,
													Number.isFinite(durationSeconds) ? durationSeconds : 0,
												);
											}}
											step={1}
											type='number'
											value={rule.action.durationSeconds ?? 0}
										/>
									</label>
								</div>
							)}
							{(rule.action.type === 'idle' || rule.action.type === 'slime') && (
								<div className='space-y-2'>
									<label className='flex items-center gap-2 text-muted-foreground text-xs'>
										<input
											aria-label='Activar acción'
											checked={rule.action.enabled}
											className='size-3.5 accent-primary'
											onChange={(event) =>
												setActionEnabled(rule.id, rule.action, event.target.checked)
											}
											type='checkbox'
										/>
										{rule.action.enabled ? 'Activar' : 'Desactivar'}
									</label>
									{rule.action.type === 'idle' && rule.action.enabled && (
										<label className='flex items-center justify-between gap-2 text-muted-foreground text-xs'>
											<span>Apagar idle en (0 = manual)</span>
											<input
												aria-label='Segundos para apagar el idle'
												className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
												max={300}
												min={0}
												onChange={(event) => {
													const durationSeconds = Number(event.target.value);
													setActionDuration(
														rule.id,
														rule.action,
														Number.isFinite(durationSeconds) ? durationSeconds : 0,
													);
												}}
												step={1}
												type='number'
												value={rule.action.durationSeconds ?? 0}
											/>
										</label>
									)}
								</div>
							)}
							{rule.action.type === 'throw_object' && (
								<label className='flex items-center gap-2 text-muted-foreground text-xs'>
									<span className='shrink-0'>Objeto</span>
									<div className='relative min-w-0 flex-1'>
										<select
											aria-label='Tipo de objeto 3D'
											className='h-8 w-full appearance-none rounded-md border border-border bg-background py-1 pr-8 pl-2 text-foreground text-xs'
											onChange={(event) =>
												updateThrowAction(rule.id, rule.action, {
													kind: event.target.value as VrmDropObjectKind,
												})
											}
											value={rule.action.kind ?? 'random'}
										>
											<option value='random'>Aleatorio</option>
											<option value='ball'>Pelota</option>
											<option value='rubber_duck'>Patito de hule</option>
											<option value='sneaker'>Zapatilla</option>
											<option value='apple'>Manzana</option>
											<option value='donut'>Dona</option>
											<option value='heart'>Corazón</option>
											<option value='star'>Estrella</option>
										</select>
										<ChevronDown
											aria-hidden='true'
											className='-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 size-3.5 text-muted-foreground'
										/>
									</div>
								</label>
							)}
							{rule.action.type === 'throw_object' && (
								<label className='flex items-center justify-between gap-2 text-muted-foreground text-xs'>
									Fuerza del lanzamiento
									<input
										aria-label='Fuerza del lanzamiento'
										className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
										max={2.5}
										min={0.25}
										onChange={(event) =>
											updateThrowAction(rule.id, rule.action, {
												strength: Number(event.target.value),
											})
										}
										step={0.05}
										type='number'
										value={rule.action.strength ?? 1}
									/>
								</label>
							)}
							{rule.action.type === 'bone_pose' && (
								<div className='grid grid-cols-2 gap-2'>
									<select
										aria-label='Hueso del avatar'
										className='h-8 rounded-md border border-border bg-background px-2 text-xs'
										onChange={(event) =>
											updateBoneAction(rule.id, rule.action, { bone: event.target.value })
										}
										value={rule.action.bone}
									>
										{[
											'head',
											'neck',
											'chest',
											'spine',
											'hips',
											'leftUpperArm',
											'leftLowerArm',
											'rightUpperArm',
											'rightLowerArm',
										].map((bone) => (
											<option key={bone}>{bone}</option>
										))}
									</select>
									<label className='flex items-center gap-2 text-muted-foreground text-xs'>
										Grados
										<input
											aria-label='Rotación del hueso en grados'
											className='h-8 w-20 rounded-md border border-border bg-background px-2 text-foreground'
											max={90}
											min={-90}
											onChange={(event) =>
												updateBoneAction(rule.id, rule.action, {
													rotation: Number(event.target.value),
												})
											}
											type='number'
											value={rule.action.rotation}
										/>
									</label>
									<label className='col-span-2 flex items-center justify-between text-muted-foreground text-xs'>
										Restablecer en (s)
										<input
											aria-label='Duración de pose del hueso'
											className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
											max={300}
											min={1}
											onChange={(event) =>
												updateBoneAction(rule.id, rule.action, {
													durationSeconds: Number(event.target.value),
												})
											}
											type='number'
											value={rule.action.durationSeconds}
										/>
									</label>
								</div>
							)}
							{rule.action.type === 'bone_scale' && (
								<div className='grid grid-cols-2 gap-2'>
									<select
										aria-label='Hueso a escalar'
										className='h-8 rounded-md border border-border bg-background px-2 text-xs'
										onChange={(event) =>
											updateBoneScaleAction(rule.id, rule.action, { bone: event.target.value })
										}
										value={rule.action.bone}
									>
										{[
											'head',
											'neck',
											'chest',
											'spine',
											'hips',
											'leftUpperArm',
											'leftLowerArm',
											'rightUpperArm',
											'rightLowerArm',
										].map((bone) => (
											<option key={bone}>{bone}</option>
										))}
									</select>
									<label className='flex items-center gap-2 text-muted-foreground text-xs'>
										Escala
										<input
											aria-label='Escala del hueso'
											className='h-8 w-20 rounded-md border border-border bg-background px-2 text-foreground'
											max={1.8}
											min={0.5}
											onChange={(event) =>
												updateBoneScaleAction(rule.id, rule.action, {
													scale: Number(event.target.value),
												})
											}
											step={0.05}
											type='number'
											value={rule.action.scale}
										/>
									</label>
									<label className='col-span-2 flex items-center justify-between text-muted-foreground text-xs'>
										Restablecer en (s)
										<input
											aria-label='Duración de escala del hueso'
											className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
											max={300}
											min={1}
											onChange={(event) =>
												updateBoneScaleAction(rule.id, rule.action, {
													durationSeconds: Number(event.target.value),
												})
											}
											type='number'
											value={rule.action.durationSeconds}
										/>
									</label>
								</div>
							)}
							{rule.action.type === 'emoji_rain' && (
								<div className='grid grid-cols-2 gap-2'>
									<label className='flex items-center justify-between gap-1 text-[11px] text-muted-foreground'>
										Cantidad
										<input
											aria-label='Cantidad de emotes'
											className='h-8 w-16 rounded-md border border-border bg-background px-1 text-foreground'
											max={40}
											min={1}
											onChange={(event) =>
												updateEmojiRainAction(rule.id, rule.action, {
													amount: Number(event.target.value),
												})
											}
											type='number'
											value={rule.action.amount}
										/>
									</label>
									<label className='flex items-center justify-between gap-1 text-[11px] text-muted-foreground'>
										Tamaño
										<input
											aria-label='Tamaño de emotes'
											className='h-8 w-16 rounded-md border border-border bg-background px-1 text-foreground'
											max={0.5}
											min={0.08}
											onChange={(event) =>
												updateEmojiRainAction(rule.id, rule.action, {
													size: Number(event.target.value),
												})
											}
											step={0.02}
											type='number'
											value={rule.action.size}
										/>
									</label>
									<label className='flex items-center justify-between gap-1 text-[11px] text-muted-foreground'>
										Radio
										<input
											aria-label='Radio de caída'
											className='h-8 w-16 rounded-md border border-border bg-background px-1 text-foreground'
											max={1.5}
											min={0.15}
											onChange={(event) =>
												updateEmojiRainAction(rule.id, rule.action, {
													radius: Number(event.target.value),
												})
											}
											step={0.05}
											type='number'
											value={rule.action.radius}
										/>
									</label>
									<label className='flex items-center justify-between gap-1 text-[11px] text-muted-foreground'>
										Gravedad
										<input
											aria-label='Gravedad de emotes'
											className='h-8 w-16 rounded-md border border-border bg-background px-1 text-foreground'
											max={4}
											min={0.2}
											onChange={(event) =>
												updateEmojiRainAction(rule.id, rule.action, {
													gravity: Number(event.target.value),
												})
											}
											step={0.1}
											type='number'
											value={rule.action.gravity}
										/>
									</label>
									<label className='col-span-2 flex items-center justify-between text-[11px] text-muted-foreground'>
										Duración al caer (s)
										<input
											aria-label='Duración de los emotes'
											className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
											max={20}
											min={1}
											onChange={(event) =>
												updateEmojiRainAction(rule.id, rule.action, {
													durationSeconds: Number(event.target.value),
												})
											}
											type='number'
											value={rule.action.durationSeconds}
										/>
									</label>
								</div>
							)}
							{rule.action.type === 'slime' && (
								<div className='space-y-2'>
									<label className='flex items-center justify-between gap-3 text-muted-foreground text-xs'>
										<span>Color del slime</span>
										<input
											aria-label='Color del slime'
											className='h-8 w-12 cursor-pointer rounded-md border border-border bg-background p-1'
											onChange={(event) => {
												const color = event.target.value;
												updateAction(rule.id, {
													type: 'slime',
													enabled: rule.action.type === 'slime' ? rule.action.enabled : true,
													durationSeconds:
														rule.action.type === 'slime' ? rule.action.durationSeconds : undefined,
													color,
												});
												vrmManager.setSlimeColor(color);
											}}
											type='color'
											value={rule.action.color ?? DEFAULT_VRM_SLIME_COLOR}
										/>
									</label>
									{rule.action.enabled && (
										<label className='flex items-center justify-between gap-3 text-muted-foreground text-xs'>
											<span>Apagar en (0 = manual)</span>
											<span className='flex items-center gap-1.5'>
												<input
													aria-label='Segundos para apagar el slime'
													className='h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-foreground'
													max={300}
													min={0}
													onChange={(event) => {
														const seconds = Number(event.target.value);
														updateAction(rule.id, {
															type: 'slime',
															enabled: true,
															durationSeconds: Number.isFinite(seconds) ? seconds : 0,
															color: rule.action.type === 'slime' ? rule.action.color : undefined,
														});
													}}
													step={1}
													type='number'
													value={rule.action.durationSeconds ?? 0}
												/>
												<span>s</span>
											</span>
										</label>
									)}
								</div>
							)}
							<Button
								className='w-full'
								onClick={() =>
									vrmManager.executeTriggerAction(
										rule.action,
										true,
										rule.action.type === 'emoji_rain' ? { message: '🎉' } : {},
									)
								}
								size='sm'
								variant='secondary'
							>
								<Play className='mr-1 size-3.5' /> Probar acción
							</Button>
						</article>
					))}
				</div>

				<Button
					className='w-full'
					onClick={() => update([...rules, addVrmTriggerRule()])}
					size='sm'
					variant='outline'
				>
					<Plus className='mr-1 size-3.5' /> Añadir regla
				</Button>
			</section>
			<Dialog
				open={rewardDialogRuleId !== null}
				onOpenChange={(open) => {
					if (!open) setRewardDialogRuleId(null);
				}}
			>
				<DialogContent className='flex max-h-[85vh] w-[min(92vw,34rem)] flex-col gap-0 overflow-hidden p-0'>
					<DialogHeader className='border-border/70 border-b px-5 py-4'>
						<DialogTitle className='text-base'>Elige una recompensa</DialogTitle>
						<DialogDescription className='text-xs'>
							La acción del avatar se ejecutará cuando alguien canjee esta recompensa en Twitch.
						</DialogDescription>
					</DialogHeader>
					<div className='border-border/60 border-b p-3'>
						<label className='flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5'>
							<Search aria-hidden='true' className='size-3.5 shrink-0 text-muted-foreground' />
							<input
								aria-label='Buscar recompensa'
								className='min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground'
								onChange={(event) => setRewardSearch(event.target.value)}
								placeholder='Buscar por nombre'
								value={rewardSearch}
							/>
						</label>
					</div>
					<div className='min-h-0 space-y-1 overflow-y-auto p-3'>
						<button
							className='flex min-h-12 w-full items-center justify-between rounded-lg border border-border/70 px-3 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted/40'
							onClick={() => {
								if (rewardDialogRule) updateRule(rewardDialogRule.id, { rewardId: undefined });
								setRewardDialogRuleId(null);
							}}
							type='button'
						>
							<span>
								<span className='block font-medium text-foreground'>Todas las recompensas</span>
								<span className='mt-0.5 block text-[10px] text-muted-foreground'>
									Sin filtro por recompensa
								</span>
							</span>
							{!rewardDialogRule?.rewardId && <Check className='size-4 text-primary' />}
						</button>
						{channelRewardsLoading ? (
							<p className='px-3 py-8 text-center text-muted-foreground text-xs'>
								Cargando recompensas…
							</p>
						) : filteredRewards.length ? (
							filteredRewards.map((reward) => {
								const selected = rewardDialogRule?.rewardId === reward.reward_id;
								return (
									<button
										className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left transition-colors ${selected ? 'border-primary/60 bg-primary/5' : 'border-border/70 hover:border-primary/50 hover:bg-muted/40'}`}
										key={reward.reward_id}
										onClick={() => {
											if (rewardDialogRule)
												updateRule(rewardDialogRule.id, { rewardId: reward.reward_id });
											setRewardDialogRuleId(null);
										}}
										type='button'
									>
										<span className='flex min-w-0 items-center gap-2.5'>
											<span
												aria-hidden='true'
												className='size-2.5 shrink-0 rounded-sm border border-white/15'
												style={{ backgroundColor: reward.background_color || '#9146ff' }}
											/>
											<span className='truncate font-medium text-foreground'>{reward.title}</span>
										</span>
										<span className='flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground'>
											{reward.cost.toLocaleString()} pts
											{selected && <Check aria-hidden='true' className='size-4 text-primary' />}
										</span>
									</button>
								);
							})
						) : (
							<p className='px-3 py-8 text-center text-muted-foreground text-xs'>
								{channelRewards.length
									? 'No hay recompensas que coincidan con la búsqueda.'
									: 'No hay recompensas de Twitch disponibles. Conecta tu canal para cargarlas.'}
							</p>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
