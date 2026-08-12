'use client';

import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarModelListCard } from '@/containers/avatar/components/AvatarModelListCard';
import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import type { SandyOnboardingContext, StepProps } from '@/components/onboarding/onboarding.types';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import { useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import { MonitorSpeaker } from 'lucide-react';

export function VTubeStudioStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const {
		connecting,
		connected,
		error,
		stats,
		models,
		currentModel,
		folderInfo,
		connect,
		disconnect,
		refreshModels,
		loadModel,
	} = useVTubeStudio();

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.32 }}
				>
					<AvatarConnectionCard
						connecting={connecting}
						connected={connected}
						error={error}
						stats={stats}
						onConnect={connect}
						onDisconnect={async () => {
							await disconnect();
							void updateContext({
								flowData: { ...state?.context.flowData, vtubeConnected: false },
							});
						}}
						onRefreshModels={refreshModels}
					/>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.32, delay: 0.05 }}
				>
					<AvatarModelListCard
						connected={connected}
						models={models}
						currentModelId={currentModel?.modelID ?? null}
						modelsFolderPath={folderInfo?.models}
						onLoadModel={async (modelID) => {
							await loadModel(modelID);
							void updateContext({
								flowData: {
									...state?.context.flowData,
									vtubeConnected: true,
								},
							});
						}}
					/>
				</motion.div>
			</div>
			<p className='flex items-center gap-1.5 text-muted-foreground text-xs'>
				<MonitorSpeaker className='size-4 shrink-0' />
				Tené VTube Studio abierto en tu PC y activá la opción &quot;Allow Plugin API access&quot; en
				el puerto 8001.
			</p>
		</OnboardingStepFrame>
	);
}
