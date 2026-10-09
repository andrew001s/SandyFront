'use client';

import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { Avatar3DEmotionsCard } from '@/containers/avatar/components/Avatar3DEmotionsCard';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarExpressionsCard } from '@/containers/avatar/components/AvatarExpressionsCard';
import { AvatarHeader } from '@/containers/avatar/components/AvatarHeader';
import { AvatarHotkeysCard } from '@/containers/avatar/components/AvatarHotkeysCard';
import { AvatarModelInfoCard } from '@/containers/avatar/components/AvatarModelInfoCard';
import { AvatarModelListCard } from '@/containers/avatar/components/AvatarModelListCard';
import { AvatarModelPositionCard } from '@/containers/avatar/components/AvatarModelPositionCard';
import { AvatarPerformanceCard } from '@/containers/avatar/components/AvatarPerformanceCard';
import { AvatarSoftwareSelector } from '@/containers/avatar/components/AvatarSoftwareSelector';
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
		<div className='container mx-auto space-y-8 px-4 py-8'>
			{/* Encabezado */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<AvatarHeader />
			</motion.div>

			{/* Selector de Software: VTube Studio (2D) vs VSeeFace (3D) */}
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

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* Columna Izquierda (Principal) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className='space-y-6 lg:col-span-2'
				>
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

					{/* 2D VTube Studio: Lista de modelos Live2D */}
					{!is3D && (
						<AvatarModelListCard
							connected={connected}
							models={vts.models}
							currentModelId={vts.currentModel?.modelID ?? null}
							modelsFolderPath={vts.folderInfo?.models}
							onLoadModel={vts.loadModel}
						/>
					)}

					{/* 3D VSeeFace: Emociones VRM con slider y presets de transición */}
					{is3D && (
						<Avatar3DEmotionsCard
							connected={connected}
							transitionDurationMs={activeConfig.transitionDurationMs ?? 120}
							onUpdateTransitionDuration={(ms) =>
								updateConfig('vseeface', { transitionDurationMs: ms })
							}
							onSetEmotion={setEmotion}
							onResetEmotions={resetEmotions}
						/>
					)}
				</motion.div>

				{/* Columna Derecha (Información y rendimiento) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.2 }}
					className='space-y-6'
				>
					{!is3D && (
						<>
							<AvatarModelInfoCard currentModel={vts.currentModel} />
							<AvatarModelPositionCard
								connected={connected}
								currentModel={vts.currentModel}
								onMoveModel={vts.moveModel}
							/>
						</>
					)}

					{!is3D && <AvatarPerformanceCard stats={vts.stats} connected={connected} />}
					{connected && <LipSyncTest connected={connected} />}
				</motion.div>
			</div>

			{/* Expresiones y Hotkeys exclusivas de 2D VTS */}
			{!is3D && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.3 }}
					className='grid grid-cols-1 gap-6 md:grid-cols-2'
				>
					<AvatarExpressionsCard
						connected={connected}
						expressions={vts.expressions}
						onSetExpression={vts.setExpressionActive}
					/>
					<AvatarHotkeysCard
						connected={connected}
						hotkeys={vts.hotkeys}
						onTriggerHotkey={vts.triggerHotkey}
					/>
				</motion.div>
			)}
		</div>
	);
};
