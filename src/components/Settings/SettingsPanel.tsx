'use client';

import { SandyCoreConfigPanel } from '@/components/Settings/SandyCoreConfigPanel';
import { AiProviderSection } from '@/components/Settings/sections/AiProviderSection';
import { ServiceLifecycleSection } from '@/components/Settings/sections/ServiceLifecycleSection';
import { SettingsHeader } from '@/components/Settings/SettingsHeader';
import { SpeechSection } from '@/components/Settings/sections/SpeechSection';
import { VoiceSection } from '@/components/Settings/sections/VoiceSection';
import { OpenRouterModelDialog } from '@/components/Settings/OpenRouterModelDialog';
import { azureLanguages, azureRegions } from '@/components/Settings/settings.constants';
import { useSettingsPanel } from '@/components/Settings/useSettingsPanel';
import { SettingsSkeleton } from '@/components/loading/dashboard-skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Cpu, Mic, Power, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const SETTINGS_TABS = ['sandy', 'ai', 'voice', 'speech', 'services'] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

const resolveTab = (value?: string): SettingsTab =>
	SETTINGS_TABS.includes(value as SettingsTab) ? (value as SettingsTab) : 'sandy';

export function SettingsPanel({ defaultTab }: { defaultTab?: string } = {}) {
	const [activeTab, setActiveTab] = useState<SettingsTab>(() => resolveTab(defaultTab));

	// El tab llega por query param (?tab=ai) desde los accesos directos del modal
	// de micrófono, así que se sincroniza si la URL cambia sin desmontar el panel.
	useEffect(() => {
		setActiveTab(resolveTab(defaultTab));
	}, [defaultTab]);

	const {
		form,
		isSaving,
		isStopping,
		isBusy,
		settingsLoading,
		sandyConfig,
		geminiState,
		openRouterState,
		speechState,
		fishState,
		browserSupportsNativeSpeech,
		isOpenRouterModalOpen,
		setIsOpenRouterModalOpen,
		openRouterSearch,
		setOpenRouterSearch,
		openRouterSort,
		handleOpenRouterSortChange,
		isOpenRouterSortOpen,
		setIsOpenRouterSortOpen,
		isAzureRegionOpen,
		setIsAzureRegionOpen,
		isAzureLanguageOpen,
		setIsAzureLanguageOpen,
		updateField,
		updateLifecycleBoolean,
		updateSttProvider,
		updateIdleTimeout,
		updateChunkSize,
		handleSandyConfigChange,
		handleStopService,
		handleProviderChange,
		handlePickOpenRouterModel,
		loadOpenRouterModels,
		openRouterModelError,
		isLoadingModels,
		openRouterModels,
		visibleOpenRouterModels,
		visibleOpenRouterCount,
		handleOpenRouterScroll,
		handleSave,
	} = useSettingsPanel();

	if (settingsLoading) {
		return <SettingsSkeleton />;
	}

	return (
		<div>
			<section className='space-y-4'>
				<SettingsHeader isBusy={isBusy} isSaving={isSaving} onSave={handleSave} />

				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(resolveTab(value))}
					className='space-y-4'
				>
					<TabsList className=' h-auto w-full grid-cols-5 rounded-2xl bg-muted p-1'>
						<TabsTrigger
							value='sandy'
							className='rounded-xl py-2 text-xs data-[state=active]:bg-background sm:text-sm'
						>
							<span className='flex items-center gap-2'>
								<Cpu className='size-4' />
								<span className='hidden sm:inline'>Personalida Vtuber</span>
							</span>
						</TabsTrigger>
						<TabsTrigger
							value='ai'
							className='rounded-xl py-2 text-xs data-[state=active]:bg-background sm:text-sm'
						>
							<span className='flex items-center gap-2'>
								<Bot className='size-4' />
								<span className='hidden sm:inline'>IA</span>
							</span>
						</TabsTrigger>
						<TabsTrigger
							value='voice'
							className='rounded-xl py-2 text-xs data-[state=active]:bg-background sm:text-sm'
						>
							<span className='flex items-center gap-2'>
								<Volume2 className='size-4' />
								<span className='hidden sm:inline'>Voz</span>
							</span>
						</TabsTrigger>
						<TabsTrigger
							value='speech'
							className='rounded-xl py-2 text-xs data-[state=active]:bg-background sm:text-sm'
						>
							<span className='flex items-center gap-2'>
								<Mic className='size-4' />
								<span className='hidden sm:inline'>Reconocimiento</span>
							</span>
						</TabsTrigger>
						<TabsTrigger
							value='services'
							className='rounded-xl py-2 text-xs data-[state=active]:bg-background sm:text-sm'
						>
							<span className='flex items-center gap-2'>
								<Power className='size-4' />
								<span className='hidden sm:inline'>Servicios</span>
							</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value='sandy' className='mt-0'>
						<SandyCoreConfigPanel config={sandyConfig} onConfigChange={handleSandyConfigChange} />
					</TabsContent>

					<TabsContent value='ai' className='mt-0'>
						<AiProviderSection
							form={form}
							geminiState={geminiState}
							openRouterState={openRouterState}
							setOpenRouterModalOpen={setIsOpenRouterModalOpen}
							updateField={updateField}
							onProviderChange={handleProviderChange}
							updateChunkSize={updateChunkSize}
						/>
					</TabsContent>

					<TabsContent value='voice' className='mt-0'>
						<VoiceSection form={form} fishState={fishState} updateField={updateField} />
					</TabsContent>

					<TabsContent value='speech' className='mt-0'>
						<SpeechSection
							form={form}
							speechState={speechState}
							browserSupportsNativeSpeech={browserSupportsNativeSpeech}
							isAzureRegionOpen={isAzureRegionOpen}
							setIsAzureRegionOpen={setIsAzureRegionOpen}
							isAzureLanguageOpen={isAzureLanguageOpen}
							setIsAzureLanguageOpen={setIsAzureLanguageOpen}
							updateField={updateField}
							updateSttProvider={updateSttProvider}
							azureRegions={azureRegions}
							azureLanguages={azureLanguages}
						/>
					</TabsContent>

					<TabsContent value='services' className='mt-0'>
						<ServiceLifecycleSection
							form={form}
							isStopping={isStopping}
							onStopService={handleStopService}
							updateField={updateField}
							updateLifecycleBoolean={updateLifecycleBoolean}
							updateIdleTimeout={updateIdleTimeout}
						/>
					</TabsContent>
				</Tabs>
			</section>

			<OpenRouterModelDialog
				open={isOpenRouterModalOpen}
				onOpenChange={setIsOpenRouterModalOpen}
				search={openRouterSearch}
				setSearch={setOpenRouterSearch}
				sort={openRouterSort}
				setSort={handleOpenRouterSortChange}
				isSortOpen={isOpenRouterSortOpen}
				setIsSortOpen={setIsOpenRouterSortOpen}
				loadModels={loadOpenRouterModels}
				isLoading={isLoadingModels}
				error={openRouterModelError}
				models={openRouterModels}
				visibleModels={visibleOpenRouterModels}
				visibleCount={visibleOpenRouterCount}
				onScroll={handleOpenRouterScroll}
				onPickModel={handlePickOpenRouterModel}
			/>
		</div>
	);
}
