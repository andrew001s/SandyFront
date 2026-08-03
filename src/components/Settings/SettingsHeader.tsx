import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';

type SettingsHeaderProps = {
	isBusy: boolean;
	isSaving: boolean;
	onSave: () => void;
};

export function SettingsHeader({ isBusy, isSaving, onSave }: SettingsHeaderProps) {
	return (
		<Card className='overflow-hidden border-border/60 bg-card/90 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.22)] backdrop-blur-xl'>
			<div className='px-6 py-6 sm:px-8'>
				<div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
					<div className='space-y-2'>
						<CardTitle className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
							Configuración
						</CardTitle>
						<CardDescription className='max-w-2xl text-sm sm:text-base'>
							Ajusta los proveedores, claves y voz con una interfaz más limpia, clara y modular.
						</CardDescription>
					</div>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
						
						<Button onClick={onSave} disabled={isBusy} className='bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'>
							<Save className='size-4' />
							{isSaving ? 'Guardando...' : 'Guardar configuración'}
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
}
