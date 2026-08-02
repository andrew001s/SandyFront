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

export function SettingsPanel() {
	const {
		form,
		isSaving,
		isStopping,
		isBusy,
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

	return (
		<div>
			<section className='space-y-6'>
				<SettingsHeader isBusy={isBusy} isSaving={isSaving} onSave={handleSave} />

				<div className='grid gap-4 xl:grid-cols-2'>
					<SandyCoreConfigPanel config={sandyConfig} onConfigChange={handleSandyConfigChange} />
					<AiProviderSection
						form={form}
						geminiState={geminiState}
						openRouterState={openRouterState}
						setOpenRouterModalOpen={setIsOpenRouterModalOpen}
						updateField={updateField}
						onProviderChange={handleProviderChange}
					/>
					<VoiceSection form={form} fishState={fishState} updateField={updateField} />
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
					<ServiceLifecycleSection
						form={form}
						isStopping={isStopping}
						onStopService={handleStopService}
						updateField={updateField}
						updateLifecycleBoolean={updateLifecycleBoolean}
						updateIdleTimeout={updateIdleTimeout}
					/>
				</div>
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
