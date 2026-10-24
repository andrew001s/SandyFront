'use client';

import { Button } from '@/components/ui/button';
import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { Avatar2dCanvas } from '@/containers/avatar/components/2d/Avatar2dCanvas';
import { Avatar3DEmotionsCard } from '@/containers/avatar/components/Avatar3DEmotionsCard';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarHeader } from '@/containers/avatar/components/AvatarHeader';
import { AvatarModelDeck } from '@/containers/avatar/components/AvatarModelDeck';
import { AvatarSoftwareSelector } from '@/containers/avatar/components/AvatarSoftwareSelector';
import { AvatarStudioDeck } from '@/containers/avatar/components/AvatarStudioDeck';
import { VrmCanvas } from '@/containers/avatar/components/VrmCanvas';
import { useAvatar } from '@/hooks/useAvatar';
import { motion } from 'framer-motion';
import { useState } from 'react';

export const AvatarContainer = () => {
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

	return (
		<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-6 px-4 py-8 md:px-6'>
			{/* Encabezado */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<AvatarHeader />
			</motion.div>

			{/* Selector de Software: Avatar 2D (Navegador) vs Avatar 3D (VRM) */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.05 }}
			>
				<AvatarSoftwareSelector
					selectedSoftware={activeSoftware}
					connectedSoftware={connected ? activeSoftware : null}
					isConnecting={connecting}
					onSelect={setSoftware}
				/>
			</motion.div>

			{activeSoftware === 'vrm' ? (
				<div className='w-full'>
					{/* Escenario 3D interactivo WebGL (Estilo VTube Studio / VNyan con Dock, Expresiones, Lip Sync y Fondo) */}
					<VrmCanvas className='w-full' />
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
				<div className='w-full space-y-6'>
					{/* Escenario Live2D dedicado en Navegador */}
					<Avatar2dCanvas mode='live2d' className='w-full' />

					{/* Opción secundaria para streamers que usen VTube Studio Desktop por WebSocket */}
					<div className='flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-4'>
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<div>
								<h3 className='font-semibold text-foreground text-xs sm:text-sm'>
									Conexión externa con VTube Studio App (Desktop)
								</h3>
								<p className='text-[11px] text-muted-foreground'>
									Si ya tienes VTube Studio instalado en tu PC, puedes conectarte vía WebSocket
									local opcionalmente.
								</p>
							</div>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowExternalVts(!showExternalVts)}
								className='h-7.5 px-3 font-medium text-xs'
							>
								{showExternalVts ? 'Ocultar conexión VTS' : 'Abrir conexión VTS'}
							</Button>
						</div>

						{showExternalVts && (
							<div className='grid grid-cols-1 items-start gap-6 pt-3 lg:grid-cols-2'>
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
				<div className='w-full space-y-6'>
					{/* Escenario PNGTuber dedicado en Navegador */}
					<Avatar2dCanvas mode='pngtuber' className='w-full' />
				</div>
			)}
		</div>
	);
};
