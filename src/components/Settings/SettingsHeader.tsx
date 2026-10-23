import { Button } from '@/components/ui/button';
import { Save, Sparkles } from 'lucide-react';

type SettingsHeaderProps = {
	isBusy: boolean;
	isSaving: boolean;
	onSave: () => void;
};

export function SettingsHeader({ isBusy, isSaving, onSave }: SettingsHeaderProps) {
	return (
		<div className='flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between'>
			<div className='flex items-center gap-2.5'>
				<span className='flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background/50 text-primary'>
					<Sparkles className='size-4' />
				</span>
				<div>
					<p className='font-display font-medium text-foreground text-sm'>Ajustes y Parámetros</p>
					<p className='font-sans text-muted-foreground text-xs'>
						Guarda los cambios antes de volver a iniciar la transmisión en vivo.
					</p>
				</div>
			</div>
			<Button
				onClick={onSave}
				disabled={isBusy}
				size='sm'
				className='gap-2 rounded-lg bg-primary font-sans font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90'
			>
				<Save className='size-3.5' />
				<span>{isSaving ? 'Guardando...' : 'Guardar configuración'}</span>
			</Button>
		</div>
	);
}
