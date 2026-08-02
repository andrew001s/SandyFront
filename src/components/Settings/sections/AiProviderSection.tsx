import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import { type SettingsFormState } from '@/components/Settings/settings.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot } from 'lucide-react';

type AiProviderSectionProps = {
	form: SettingsFormState;
	geminiState: string;
	openRouterState: string;
	setOpenRouterModalOpen: (open: boolean) => void;
	updateField: (field: keyof SettingsFormState, value: string) => void;
	onProviderChange: (value: 'gemini' | 'openrouter') => void;
};

export function AiProviderSection({
	form,
	geminiState,
	openRouterState,
	setOpenRouterModalOpen,
	updateField,
	onProviderChange,
}: AiProviderSectionProps) {
	return (
		<SettingsSectionCard
			icon={<Bot className='size-5' />}
			title='Proveedor de IA'
			description='Selecciona el motor que usará tu asistente y guarda la clave correspondiente.'
			statusLabel={geminiState === 'Configurado' || openRouterState === 'Configurado' ? 'Listo' : 'Pendiente'}
			statusTone={
				geminiState === 'Configurado' || openRouterState === 'Configurado'
					? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
			}
			highlighted
		>
			<Tabs
				value={form.ai_provider}
				onValueChange={(value) => onProviderChange(value as 'gemini' | 'openrouter')}
				className='w-full'
			>
				<TabsList className='w-full'>
					<TabsTrigger value='gemini' className='flex-1'>
						Gemini
					</TabsTrigger>
					<TabsTrigger value='openrouter' className='flex-1'>
						OpenRouter
					</TabsTrigger>
				</TabsList>

				<TabsContent value='gemini'>
					<div className='space-y-2 pt-4'>
						<Label htmlFor='gemini_api_key'>Gemini API Key</Label>
						<Input
							id='gemini_api_key'
							type='password'
							placeholder='AIza...'
							value={form.gemini_api_key}
							onChange={(event) => updateField('gemini_api_key', event.target.value)}
						/>
					</div>
				</TabsContent>

				<TabsContent value='openrouter'>
					<div className='grid gap-4 pt-4 lg:grid-cols-2'>
						<div className='space-y-2 lg:col-span-2'>
							<Label htmlFor='openrouter_api_key'>OpenRouter API Key</Label>
							<Input
								id='openrouter_api_key'
								type='password'
								placeholder='sk-or-v1-...'
								value={form.openrouter_api_key}
								onChange={(event) => updateField('openrouter_api_key', event.target.value)}
							/>
						</div>
						<div className='space-y-2 lg:col-span-2'>
							<Label htmlFor='openrouter_model'>OpenRouter Model</Label>
							<div className='flex flex-col gap-3 sm:flex-row'>
								<Input
									id='openrouter_model'
									readOnly
									value={form.openrouter_model || 'Selecciona un modelo de texto'}
									className='bg-background/70'
								/>
								<Button
									type='button'
									variant='outline'
									onClick={() => setOpenRouterModalOpen(true)}
									className='shrink-0'
								>
									Buscar modelos
								</Button>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
			<div className='flex flex-wrap gap-2 pt-1'>
				<Badge variant='outline' className='border-border/70 bg-background/60 text-muted-foreground'>
					{form.ai_provider === 'gemini' ? 'Gemini activo' : 'OpenRouter activo'}
				</Badge>
			</div>
		</SettingsSectionCard>
	);
}
