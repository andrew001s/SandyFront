import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import type { SettingsFormState } from '@/components/Settings/settings.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AiProvider } from '@/lib/ai-provider';
import { Bot } from 'lucide-react';

type AiProviderSectionProps = {
	form: SettingsFormState;
	geminiState: string;
	openRouterState: string;
	localAiState: string;
	setOpenRouterModalOpen: (open: boolean) => void;
	updateField: (field: keyof SettingsFormState, value: string) => void;
	onProviderChange: (value: AiProvider) => void;
	updateChunkSize: (value: string) => void;
};

const PROVIDER_LABELS: Record<AiProvider, string> = {
	gemini: 'Gemini activo',
	openrouter: 'OpenRouter activo',
	local: 'Modelo local activo',
};

export function AiProviderSection({
	form,
	geminiState,
	openRouterState,
	localAiState,
	setOpenRouterModalOpen,
	updateField,
	onProviderChange,
	updateChunkSize,
}: AiProviderSectionProps) {
	const isConfigured =
		geminiState === 'Configurado' ||
		openRouterState === 'Configurado' ||
		localAiState === 'Configurado';

	return (
		<SettingsSectionCard
			icon={<Bot className='size-5' />}
			title='Proveedor de IA'
			description='Selecciona el motor que usará tu asistente y guarda la clave correspondiente.'
			statusLabel={isConfigured ? 'Listo' : 'Pendiente'}
			statusTone={
				isConfigured
					? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
			}
			highlighted
		>
			<Tabs
				value={form.ai_provider}
				onValueChange={(value) => onProviderChange(value as AiProvider)}
				className='w-full'
			>
				<TabsList className='w-full'>
					<TabsTrigger value='gemini' className='flex-1'>
						Gemini
					</TabsTrigger>
					<TabsTrigger value='openrouter' className='flex-1'>
						OpenRouter
					</TabsTrigger>
					<TabsTrigger value='local' className='flex-1'>
						Modelo local
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

				<TabsContent value='local'>
					<div className='grid gap-4 pt-4 lg:grid-cols-2'>
						<div className='space-y-2 lg:col-span-2'>
							<Label htmlFor='local_api_url'>URL de la API</Label>
							<Input
								id='local_api_url'
								type='url'
								placeholder='http://localhost:11434'
								value={form.local_api_url}
								onChange={(event) => updateField('local_api_url', event.target.value)}
							/>
							<p className='text-muted-foreground text-xs'>
								Sirve cualquier servidor compatible con la API de OpenAI: Ollama, LM Studio,
								llama.cpp o vLLM. Pega la raíz y se completa <code>/v1/chat/completions</code>, o
								escribe la ruta entera si tu servidor la tiene en otro sitio.
							</p>
						</div>
						<div className='space-y-2 lg:col-span-2'>
							<Label htmlFor='local_model'>Modelo (opcional)</Label>
							<Input
								id='local_model'
								placeholder='llama3.1'
								value={form.local_model}
								onChange={(event) => updateField('local_model', event.target.value)}
							/>
							<p className='text-muted-foreground text-xs'>
								Solo hace falta si tu servidor tiene varios modelos cargados. Ollama y vLLM lo
								exigen; LM Studio suele usar el que esté activo.
							</p>
						</div>
						<div className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs lg:col-span-2'>
							<p className='font-medium text-amber-600 dark:text-amber-400'>
								El navegador se conecta directo a tu servidor
							</p>
							<p className='mt-1 text-muted-foreground'>
								Por eso este es el único motor que transmite la respuesta token a token y empieza a
								hablar antes de terminar de pensar. A cambio, tu servidor tiene que aceptar
								peticiones desde esta web: en Ollama es <code>OLLAMA_ORIGINS</code>, en LM Studio el
								interruptor de CORS. Si abres Sandy por <code>https://</code>, el navegador
								bloqueará una URL <code>http://</code> que no sea <code>localhost</code>.
							</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			<div className='space-y-2 pt-4'>
				<Label htmlFor='chunk_size'>Mensajes de chat por respuesta</Label>
				<Input
					id='chunk_size'
					type='number'
					min={1}
					max={10}
					placeholder='3'
					value={form.chunk_size}
					onChange={(event) => updateChunkSize(event.target.value)}
				/>
				<p className='text-muted-foreground text-xs'>
					Cuántos mensajes del chat se agrupan antes de pedirle una respuesta a la IA. Con 1
					responde a cada mensaje; subirlo reduce el gasto de tokens y el spam en directos con mucho
					movimiento. Entre 1 y 10.
				</p>
			</div>

			<div className='flex flex-wrap gap-2 pt-1'>
				<Badge
					variant='outline'
					className='border-border/70 bg-background/60 text-muted-foreground'
				>
					{PROVIDER_LABELS[form.ai_provider]}
				</Badge>
			</div>
		</SettingsSectionCard>
	);
}
