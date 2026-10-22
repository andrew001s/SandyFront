'use client';

import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { Avatar3DEmotionsCard } from '@/containers/avatar/components/Avatar3DEmotionsCard';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarHeader } from '@/containers/avatar/components/AvatarHeader';
import { AvatarModelDeck } from '@/containers/avatar/components/AvatarModelDeck';
import { AvatarSoftwareSelector } from '@/containers/avatar/components/AvatarSoftwareSelector';
import { AvatarStudioDeck } from '@/containers/avatar/components/AvatarStudioDeck';
import { VrmCanvas } from '@/containers/avatar/components/VrmCanvas';
import { useAvatar } from '@/hooks/useAvatar';
import { motion } from 'framer-motion';

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

			{/* Selector de Software: VTube Studio (2D) vs Avatar 3D VRM */}
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
				<div className='w-full space-y-6'>
					{/* Escenario 3D interactivo WebGL a pantalla completa (Full Width) */}
					<VrmCanvas className='w-full' />

					{/* Consolas de Control de Estudio (Estilo VTS / VNyan) */}
					<div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-2'>
						{/* Deck de Expresiones y Emociones VRM */}
						<Avatar3DEmotionsCard
							connected={true}
							onSetEmotion={setEmotion}
							onResetEmotions={resetEmotions}
						/>

						{/* Deck de Lip Sync y Voz Edge TTS */}
						<LipSyncTest connected={true} software='vrm' />
					</div>
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
			) : (
				<div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-2'>
					{/* Columna Izquierda: Conexión y Biblioteca de Modelos */}
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

					{/* Columna Derecha: Control de Lip Sync y Deck de Control en Vivo */}
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
	);
};
