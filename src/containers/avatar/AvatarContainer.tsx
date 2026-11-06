'use client';
import { getSettings, saveSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { Avatar2dCanvas } from '@/containers/avatar/components/2d/Avatar2dCanvas';
import { extractLive2dExpressions } from '@/containers/avatar/components/2d/Live2dExpressionsPanel';
import { Avatar3DEmotionsCard } from '@/containers/avatar/components/Avatar3DEmotionsCard';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { StudioToolbar } from '@/containers/avatar/components/StudioToolbar';

import { AvatarModelDeck } from '@/containers/avatar/components/AvatarModelDeck';

import { AvatarStudioDeck } from '@/containers/avatar/components/AvatarStudioDeck';
import { VrmCanvas } from '@/containers/avatar/components/VrmCanvas';
import { useExpressionHotkeysContext } from '@/context/ExpressionHotkeysContext';
import { useAvatar } from '@/hooks/useAvatar';
import { useExpressionHotkeys } from '@/hooks/useExpressionHotkeys';
import { useVrmExpressions } from '@/hooks/useVrmExpressions';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import { scopedExpressionIntensities } from '@/lib/avatar/expressionIntensities';
import {
	getAutomaticReactionMappings,
	getScopedAutomaticReactionConfig,
	setAutomaticReactionConfig,
	setAutomaticReactionMapping,
} from '@/lib/avatar/reactionMappings';
import type { AutomaticReactionConfig } from '@/lib/avatar/reactionMappings';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
export const AvatarContainer = () => {
	const expressionPreferences = useExpressionHotkeysContext();
	const expressionIntensities = expressionPreferences?.intensities;
	useEffect(() => {
		if (expressionIntensities) {
			avatar2dManager.setLive2dExpressionIntensities(
				scopedExpressionIntensities(expressionIntensities, 'live2d'),
			);
			vrmManager.setConfiguredExpressionIntensities(
				scopedExpressionIntensities(expressionIntensities, 'vrm'),
			);
		}
	}, [expressionIntensities]);
	const { getToken, isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();
	const {
		activeSoftware,
		setSoftware,
		activeConfig,
		updateConfig,
		is3D,
		connecting,
		connected,
		error,
		stats,
		connect,
		disconnect,
		setEmotion,
		resetEmotions,
		vts,
	} = useAvatar();
	const [showExternalVts, setShowExternalVts] = useState(false);
	const vrmExpressions = useVrmExpressions();
	const [avatar2dState, setAvatar2dState] = useState(() => avatar2dManager.getState());
	const [live2dPackage, setLive2dPackage] = useState(() => live2dStore.getPackage());
	const [reactionMappings, setReactionMappings] = useState(getAutomaticReactionMappings);
	const [reactionSettingsReady, setReactionSettingsReady] = useState(false);
	const reactionWrites = useRef<Promise<void>>(Promise.resolve());
	const settingsOwner = useRef(userId);
	settingsOwner.current = userId;
	const reactionScope =
		activeSoftware === 'vnyan' || activeSoftware === 'vseeface' ? 'vrm' : activeSoftware;
	useEffect(() => {
		let cancelled = false;
		setReactionSettingsReady(false);
		for (const reaction of Object.keys(getAutomaticReactionMappings())) {
			setAutomaticReactionMapping(reaction, null);
		}
		setReactionMappings({});
		if (!isAuthLoaded || !isSignedIn || !userId) return;
		reactionWrites.current = reactionWrites.current
			.catch(() => undefined)
			.then(async () => {
				if (cancelled) return;
				try {
					const token = await getToken();
					const response = await getSettings({ token });
					if (cancelled) return;
					const accountMappings = response.settings?.automatic_reaction_mappings ?? {};
					for (const [reaction, expressionId] of Object.entries(accountMappings)) {
						setAutomaticReactionMapping(reaction, expressionId);
					}
					setReactionMappings(accountMappings);
					setReactionSettingsReady(true);
					if (activeSoftware === 'live2d') {
						const base = getScopedAutomaticReactionConfig('neutral', 'live2d');
						avatar2dManager.setLive2dExpressions(base.expressions);
					}
					if (response.settings?.automatic_reaction_scope !== reactionScope) {
						await saveSettings({ automatic_reaction_scope: reactionScope }, { token });
					}
				} catch (error) {
					if (!cancelled) console.error('No se pudieron cargar las reacciones automáticas:', error);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [activeSoftware, reactionScope, getToken, isAuthLoaded, isSignedIn, userId]);
	useEffect(() => {
		const unsubscribeAvatar = avatar2dManager.subscribe(setAvatar2dState);
		const unsubscribeLive2d = live2dStore.subscribe(setLive2dPackage);
		return () => {
			unsubscribeAvatar();
			unsubscribeLive2d();
		};
	}, []);
	const reactionExpressions =
		activeSoftware === 'pngtuber'
			? avatar2dState.pngtuber.emotions.map(({ id, label }) => ({ id, label }))
			: activeSoftware === 'live2d'
				? extractLive2dExpressions(live2dPackage?.modelSettingsJson, live2dPackage?.fileMap)
				: activeSoftware === 'vtubestudio'
					? vts.expressions.map(({ file, name }) => ({ id: file, label: name }))
					: vrmExpressions.map((id) => ({
							id,
							label: VRM_EMOTIONS.find((preset) => preset.id === id)?.name ?? id,
						}));
	useExpressionHotkeys(activeSoftware, reactionExpressions, (id) => {
		if (activeSoftware === 'vrm')
			vrmManager.toggleExpression(id, expressionPreferences?.intensities[`vrm:${id}`] ?? 1);
		else if (activeSoftware === 'live2d') avatar2dManager.toggleLive2dExpression(id);
		else if (activeSoftware === 'pngtuber')
			avatar2dManager.setEmotion(
				avatar2dManager.getState().pngtuber.activeEmotion === id ? 'neutral' : id,
			);
	});
	const handleReactionMappingChange = (
		reaction: string,
		config: AutomaticReactionConfig | null,
	) => {
		setAutomaticReactionConfig(reaction, config, activeSoftware);
		if (reaction === 'neutral' || config?.enabled === false) {
			void resetEmotions();
		}
		const nextMappings = getAutomaticReactionMappings();
		setReactionMappings(nextMappings);
		if (!isSignedIn || !userId) return;
		reactionWrites.current = reactionWrites.current
			.catch(() => undefined)
			.then(async () => {
				try {
					if (settingsOwner.current !== userId) return;
					const token = await getToken();
					if (settingsOwner.current !== userId) return;
					await saveSettings(
						{
							automatic_reaction_mappings: nextMappings,
							automatic_reaction_scope: reactionScope,
						},
						{ token },
					);
				} catch (error) {
					console.error('No se pudieron guardar las reacciones automáticas:', error);
					toast.error(
						'No se guardó la configuración de emociones. Revisa la conexión e inténtalo de nuevo.',
					);
				}
			});
	};
	const previewReaction = (_reaction: string, config: AutomaticReactionConfig) => {
		if (activeSoftware === 'vrm') {
			vrmManager.setEmotions(config.expressions, config.intensity);
		} else if (activeSoftware === 'live2d') {
			avatar2dManager.setLive2dExpressions(config.expressions);
		} else if (activeSoftware === 'pngtuber') {
			avatar2dManager.setEmotion(config.expressions[0] ?? 'neutral');
		}
	};
	const automaticReactions = {
		disabled: !reactionSettingsReady,
		expressions: reactionExpressions,
		mappings: reactionMappings,
		scope: activeSoftware,
		allowMultiple: activeSoftware === 'live2d' || activeSoftware === 'vrm',
		showIntensity: activeSoftware === 'vrm',
		onMappingChange: handleReactionMappingChange,
		onPreview: previewReaction,
		onPreviewEnd: resetEmotions,
	};
	return (
		<div className='flex min-h-0 w-full flex-1 flex-col overflow-hidden'>
			<StudioToolbar software={activeSoftware} connected={connected} onSelect={setSoftware} />
			<div className='flex min-h-0 flex-1 flex-col overflow-y-auto p-2 sm:p-3'>
				{activeSoftware === 'vrm' ? (
					<div className='flex min-h-0 w-full flex-1 flex-col'>
						{/* Escenario 3D interactivo WebGL (Estilo VTube Studio / VNyan con Dock, Expresiones, Lip Sync y Fondo) */}
						<VrmCanvas className='min-h-0 w-full flex-1' automaticReactions={automaticReactions} />
					</div>
				) : is3D ? (
					<div className='space-y-6'>
						<div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-2'>
							<AvatarConnectionCard
								connecting={connecting}
								connected={connected}
								error={error}
								stats={stats}
								software={activeSoftware}
								config={activeConfig}
								onConnect={connect}
								onDisconnect={disconnect}
								onRefreshModels={vts.refreshModels}
								onUpdateConfig={(updates) => updateConfig(activeSoftware, updates)}
							/>
							<LipSyncTest connected={connected} software={activeSoftware} />
						</div>
						<Avatar3DEmotionsCard
							connected={connected}
							onSetEmotion={setEmotion}
							onResetEmotions={resetEmotions}
						/>
					</div>
				) : activeSoftware === 'live2d' ? (
					<div className='flex min-h-0 w-full flex-1 flex-col gap-2'>
						{/* Escenario Live2D dedicado en Navegador */}
						<Avatar2dCanvas
							mode='live2d'
							automaticReactions={automaticReactions}
							className='min-h-0 flex-1'
						/>
						{/* Opción secundaria para streamers que usen VTube Studio Desktop por WebSocket */}
						<div className='flex shrink-0 flex-col gap-2 border-border/50 border-t px-1'>
							<div className='flex min-h-9 items-center justify-between gap-3'>
								<h3 className='truncate font-medium text-muted-foreground text-xs'>
									VTube Studio para escritorio
								</h3>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setShowExternalVts(!showExternalVts)}
									className='h-7 shrink-0 px-3 font-medium text-xs'
									aria-expanded={showExternalVts}
									aria-controls='external-vts-controls'
								>
									{showExternalVts ? 'Ocultar conexión' : 'Conectar VTube Studio'}
								</Button>
							</div>
							{showExternalVts && (
								<div
									id='external-vts-controls'
									className='grid grid-cols-1 items-start gap-6 pt-3 lg:grid-cols-2'
								>
									<div className='space-y-6'>
										<AvatarConnectionCard
											connecting={connecting}
											connected={connected}
											error={error}
											stats={stats}
											software={activeSoftware}
											config={activeConfig}
											onConnect={connect}
											onDisconnect={disconnect}
											onRefreshModels={vts.refreshModels}
											onUpdateConfig={(updates) => updateConfig(activeSoftware, updates)}
										/>
										<AvatarModelDeck
											connected={connected}
											models={vts.models}
											currentModel={vts.currentModel}
											currentModelId={vts.currentModel?.modelID ?? null}
											modelsFolderPath={vts.folderInfo?.models}
											onLoadModel={vts.loadModel}
										/>
									</div>
									<div className='space-y-6'>
										<LipSyncTest connected={connected} software={activeSoftware} />
										<AvatarStudioDeck
											connected={connected}
											currentModel={vts.currentModel}
											expressions={vts.expressions}
											hotkeys={vts.hotkeys}
											onSetExpression={vts.setExpressionActive}
											onTriggerHotkey={vts.triggerHotkey}
											onMoveModel={vts.moveModel}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				) : (
					<div className='flex min-h-0 w-full flex-1 flex-col gap-2'>
						{/* Escenario PNGTuber dedicado en Navegador */}
						<Avatar2dCanvas
							mode='pngtuber'
							automaticReactions={automaticReactions}
							className='min-h-0 flex-1'
						/>
					</div>
				)}
			</div>
		</div>
	);
};
