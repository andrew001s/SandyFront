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
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-4 py-8 md:px-6'>
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

			{is3D ? (
				<div className='space-y-6'>
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
						transitionDurationMs={activeConfig.transitionDurationMs ?? 120}
						onUpdateTransitionDuration={(ms) =>
							updateConfig('vseeface', { transitionDurationMs: ms })
						}
						onSetEmotion={setEmotion}
						onResetEmotions={resetEmotions}
					/>
				</div>
			) : (
				<div className='space-y-6'>
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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

					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						<AvatarModelListCard
							connected={connected}
							models={vts.models}
							currentModelId={vts.currentModel?.modelID ?? null}
							modelsFolderPath={vts.folderInfo?.models}
							onLoadModel={vts.loadModel}
						/>
						<AvatarModelInfoCard currentModel={vts.currentModel} />
					</div>

					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
					</div>

					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						<AvatarModelPositionCard
							connected={connected}
							currentModel={vts.currentModel}
							onMoveModel={vts.moveModel}
						/>
						<AvatarPerformanceCard stats={vts.stats} connected={connected} />
					</div>
				</div>
			)}
		</div>
	);
};
