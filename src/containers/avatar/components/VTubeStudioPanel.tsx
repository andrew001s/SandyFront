'use client';

import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import type { useAvatar } from '@/hooks/useAvatar';
import type { SoftwareConfig } from '@/types/avatar';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { AvatarConnectionCard } from './AvatarConnectionCard';
import { AvatarModelDeck } from './AvatarModelDeck';
import { AvatarStudioDeck } from './AvatarStudioDeck';

type Props = {
	connection: ReturnType<typeof useAvatar>['vts'];
	config: SoftwareConfig;
	onUpdateConfig: (updates: Partial<SoftwareConfig>) => void;
};

export function VTubeStudioPanel({ connection: vts, config, onUpdateConfig }: Props) {
	const [showDiagnostics, setShowDiagnostics] = useState(false);
	return (
		<div className='min-w-0 space-y-4'>
			<AvatarConnectionCard
				software='vtubestudio'
				connected={vts.connected}
				connecting={vts.connecting}
				error={vts.error}
				stats={vts.stats}
				config={config}
				onConnect={(options) => vts.connect(typeof options === 'number' ? options : options?.port)}
				onDisconnect={vts.disconnect}
				onRefreshModels={vts.refreshModels}
				onUpdateConfig={onUpdateConfig}
			/>
			{vts.connected && (
				<>
					<div
						className={
							vts.currentModel
								? 'grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2'
								: undefined
						}
					>
						<AvatarModelDeck
							connected={vts.connected}
							models={vts.models}
							currentModel={vts.currentModel}
							currentModelId={vts.currentModel?.modelID ?? null}
							modelsFolderPath={vts.folderInfo?.models}
							onLoadModel={vts.loadModel}
						/>
						{vts.currentModel && (
							<AvatarStudioDeck
								connected={vts.connected}
								currentModel={vts.currentModel}
								expressions={vts.expressions}
								hotkeys={vts.hotkeys}
								onSetExpression={vts.setExpressionActive}
								onTriggerHotkey={vts.triggerHotkey}
								onMoveModel={vts.moveModel}
							/>
						)}
					</div>
					{vts.currentModel && (
						<section
							className='border-border border-t'
							aria-label='Opciones avanzadas de VTube Studio'
						>
							<button
								type='button'
								aria-expanded={showDiagnostics}
								aria-controls='vts-diagnostics'
								onClick={() => setShowDiagnostics(!showDiagnostics)}
								className='flex min-h-12 w-full items-center gap-3 rounded-sm py-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
							>
								<ChevronDown
									aria-hidden
									className={`size-4 shrink-0 text-muted-foreground ${showDiagnostics ? 'rotate-180' : ''}`}
								/>
								<span className='font-medium'>Opciones avanzadas</span>
								<span className='ml-auto text-muted-foreground text-xs'>
									Prueba de voz y lipsync
								</span>
							</button>
							{showDiagnostics && (
								<div id='vts-diagnostics' className='pb-4'>
									<LipSyncTest connected={vts.connected} software='vtubestudio' embedded />
								</div>
							)}
						</section>
					)}
				</>
			)}
		</div>
	);
}
