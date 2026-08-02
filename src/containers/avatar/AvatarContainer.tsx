'use client';

import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarHeader } from '@/containers/avatar/components/AvatarHeader';
import { AvatarModelInfoCard } from '@/containers/avatar/components/AvatarModelInfoCard';
import { AvatarModelListCard } from '@/containers/avatar/components/AvatarModelListCard';
import { AvatarPerformanceCard } from '@/containers/avatar/components/AvatarPerformanceCard';
import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { motion } from 'framer-motion';

export const AvatarContainer = () => {
	const {
		connecting,
		connected,
		error,
		stats,
		models,
		currentModel,
		connect,
		disconnect,
		loadModel,
		refreshModels,
	} = useVTubeStudio();

	return (
		<div className='container mx-auto space-y-8 px-4 py-8'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<AvatarHeader />
			</motion.div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className='space-y-6 lg:col-span-2'
				>
					<AvatarConnectionCard
						connecting={connecting}
						connected={connected}
						error={error}
						stats={stats}
						onConnect={connect}
						onDisconnect={disconnect}
						onRefreshModels={refreshModels}
					/>
					<AvatarModelListCard
						connected={connected}
						models={models}
						currentModelId={currentModel?.modelID ?? null}
						onLoadModel={loadModel}
					/>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className='space-y-6'
				>
					<AvatarModelInfoCard currentModel={currentModel} />
					<AvatarPerformanceCard stats={stats} connected={connected} />
					{connected && currentModel && <LipSyncTest connected={connected} />}
				</motion.div>
			</div>
		</div>
	);
};
