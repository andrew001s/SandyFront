'use client';

import { getSettings, saveSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { Avatar2dCanvas } from '@/containers/avatar/components/2d/Avatar2dCanvas';
import { extractLive2dExpressions } from '@/containers/avatar/components/2d/Live2dExpressionsPanel';
import { Avatar3DEmotionsCard } from '@/containers/avatar/components/Avatar3DEmotionsCard';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarHeader } from '@/containers/avatar/components/AvatarHeader';
import { AvatarModelDeck } from '@/containers/avatar/components/AvatarModelDeck';
import { AvatarSoftwareSelector } from '@/containers/avatar/components/AvatarSoftwareSelector';
import { AvatarStudioDeck } from '@/containers/avatar/components/AvatarStudioDeck';
import { VrmCanvas } from '@/containers/avatar/components/VrmCanvas';
import { useAvatar } from '@/hooks/useAvatar';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import {
	getAutomaticReactionMappings,
	setAutomaticReactionMapping,
} from '@/lib/avatar/reactionMappings';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const AvatarContainer = () => {
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
	const [avatar2dState, setAvatar2dState] = useState(() => avatar2dManager.getState());
	const [live2dPackage, setLive2dPackage] = useState(() => live2dStore.getPackage());
	const [reactionMappings, setReactionMappings] = useState(getAutomaticReactionMappings);

	useEffect(() => {
		let cancelled = false;
		for (const reaction of Object.keys(getAutomaticReactionMappings())) {
			setAutomaticReactionMapping(reaction, null);
		}
		setReactionMappings({});

		if (!isAuthLoaded || !isSignedIn || !userId) return;

		void (async () => {
			try {
				const token = await getToken();
				const response = await getSettings({ token });
				if (cancelled) return;
				const accountMappings = response.settings?.automatic_reaction_mappings ?? {};
				for (const [reaction, expressionId] of Object.entries(accountMappings)) {
					setAutomaticReactionMapping(reaction, expressionId);
				}
				setReactionMappings(accountMappings);
			} catch (error) {
				if (!cancelled) console.error('No se pudieron cargar las reacciones automáticas:', error);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [getToken, isAuthLoaded, isSignedIn, userId]);

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
					: VRM_EMOTIONS.filter(({ id }) => id !== 'neutral' && id !== 'blink').map(
							({ id, name }) => ({
								id,
								label: name,
							}),
						);

	const handleReactionMappingChange = (reaction: string, expressionId: string | null) => {
		setAutomaticReactionMapping(reaction, expressionId);
		const nextMappings = { ...reactionMappings };
		if (expressionId) nextMappings[reaction] = expressionId;
		else delete nextMappings[reaction];
		setReactionMappings(nextMappings);

		if (!isSignedIn || !userId) return;
		void (async () => {
			try {
				const token = await getToken();
				await saveSettings({ automatic_reaction_mappings: nextMappings }, { token });
			} catch (error) {
				console.error('No se pudieron guardar las reacciones automáticas:', error);
			}
		})();
	};
	const automaticReactions = {
		expressions: reactionExpressions,
		mappings: reactionMappings,
		onMappingChange: handleReactionMappingChange,
	};

	return (
		<div className='mx-auto flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto px-3 py-2 md:px-4'>
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25, ease: 'easeOut' }}
				className='flex shrink-0 flex-col items-stretch gap-2 border-border/60 border-b pb-2 lg:flex-row lg:items-center lg:justify-between'
			>
				<AvatarHeader />
				<AvatarSoftwareSelector
					selectedSoftware={activeSoftware}
					connectedSoftware={connected ? activeSoftware : null}
					onSelect={setSoftware}
				/>
			</motion.div>
			{activeSoftware === 'vrm' ? (
				<div className='flex min-h-[min(26.25rem,max(16rem,calc(100dvh_-_14rem)))] w-full flex-1 flex-col'>
					{/* Escenario 3D interactivo WebGL (Estilo VTube Studio / VNyan con Dock, Expresiones, Lip Sync y Fondo) */}
					<VrmCanvas
						className='min-h-[min(26.25rem,max(16rem,calc(100dvh_-_14rem)))] w-full flex-1'
						automaticReactions={automaticReactions}
					/>
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
				<div className='flex min-h-[min(26.25rem,max(16rem,calc(100dvh_-_14rem)))] w-full flex-1 flex-col gap-2'>
					{/* Escenario Live2D dedicado en Navegador */}
					<Avatar2dCanvas
						mode='live2d'
						automaticReactions={automaticReactions}
						className='min-h-[min(26.25rem,max(16rem,calc(100dvh_-_14rem)))] flex-1'
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
				<div className='flex min-h-[min(26.25rem,max(16rem,calc(100dvh_-_14rem)))] w-full flex-1 flex-col gap-2'>
					{/* Escenario PNGTuber dedicado en Navegador */}
					<Avatar2dCanvas
						mode='pngtuber'
						automaticReactions={automaticReactions}
						className='min-h-[min(26.25rem,max(16rem,calc(100dvh_-_14rem)))] flex-1'
					/>
				</div>
			)}
		</div>
	);
};
