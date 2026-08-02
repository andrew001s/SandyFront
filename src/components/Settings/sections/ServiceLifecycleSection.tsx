import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import { type SettingsFormState } from '@/components/Settings/settings.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Power, Square } from 'lucide-react';

type ServiceLifecycleSectionProps = {
	form: SettingsFormState;
	isStopping: boolean;
	onStopService: () => void;
	updateField: (field: keyof SettingsFormState, value: string) => void;
	updateLifecycleBoolean: (field: 'auto_start_on_live' | 'auto_stop_on_offline', value: boolean) => void;
	updateIdleTimeout: (value: string) => void;
};

export function ServiceLifecycleSection({
	form,
	isStopping,
	onStopService,
	updateField,
	updateLifecycleBoolean,
	updateIdleTimeout,
}: ServiceLifecycleSectionProps) {
	return (
		<SettingsSectionCard
			icon={<Power className='size-5' />}
			title='Ciclo de vida del servicio'
			description='Controla cómo arranca y se detiene la VTuber y cuándo se apaga por inactividad.'
			statusLabel={form.service_mode === 'hybrid' ? 'Híbrido' : 'Manual'}
			statusTone={
				form.service_mode === 'hybrid'
					? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
			}
		>
			<div className='space-y-5'>
				<div className='space-y-2'>
					<Label>Modo de servicio</Label>
					<Tabs
						value={form.service_mode}
						onValueChange={(value) => updateField('service_mode', value)}
						className='w-full'
					>
						<TabsList className='w-full'>
							<TabsTrigger value='manual' className='flex-1'>
								Manual
							</TabsTrigger>
							<TabsTrigger value='hybrid' className='flex-1'>
								Híbrido
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<p className='text-muted-foreground text-xs'>
						En modo híbrido el monitor revisa el estado del stream y la inactividad para arrancar
						y detener la VTuber automáticamente.
					</p>
				</div>

				{form.service_mode !== 'hybrid' ? (
					<div className='rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 text-sm dark:text-amber-300'>
						Estás en modo manual: el arranque y la parada se controlan con los botones. Cambia a
						modo híbrido para activar las opciones automáticas.
					</div>
				) : null}

				<div
					className={
						form.service_mode === 'hybrid'
							? 'space-y-5'
							: 'pointer-events-none select-none space-y-5 opacity-60'
					}
				>
					<div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3'>
						<div className='space-y-0.5'>
							<p className='font-medium text-sm'>Arranque automático al estar live</p>
							<p className='text-muted-foreground text-xs'>
								Arranca la VTuber cuando el stream pase a estar en directo.
							</p>
						</div>
						<Switch
							checked={form.auto_start_on_live}
							disabled={form.service_mode !== 'hybrid'}
							onCheckedChange={(value) => updateLifecycleBoolean('auto_start_on_live', value)}
						/>
					</div>

					<div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3'>
						<div className='space-y-0.5'>
							<p className='font-medium text-sm'>Parada automática al cerrar stream</p>
							<p className='text-muted-foreground text-xs'>
								Detiene la VTuber cuando el stream pase a estar offline.
							</p>
						</div>
						<Switch
							checked={form.auto_stop_on_offline}
							disabled={form.service_mode !== 'hybrid'}
							onCheckedChange={(value) => updateLifecycleBoolean('auto_stop_on_offline', value)}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='idle_timeout_minutes'>Minutos de inactividad antes de apagar</Label>
						<Input
							id='idle_timeout_minutes'
							type='number'
							min={0}
							placeholder='60'
							disabled={form.service_mode !== 'hybrid'}
							value={form.idle_timeout_minutes}
							onChange={(event) => updateIdleTimeout(event.target.value)}
						/>
						<p className='text-muted-foreground text-xs'>
							Si la VTuber no tiene actividad durante este tiempo, se detiene sola. Usa 0 para
							desactivarlo.
						</p>
					</div>
				</div>

				<Button
					type='button'
					variant='outline'
					onClick={onStopService}
					disabled={isStopping}
					className='w-full'
				>
					<Square className='size-4' />
					{isStopping ? 'Pausando...' : 'Pausar servicios'}
				</Button>
			</div>
		</SettingsSectionCard>
	);
}
