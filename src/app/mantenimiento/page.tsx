import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { Wrench } from 'lucide-react';

export const metadata: Metadata = noIndexMetadata;

export default function MantenimientoPage() {
	return (
		<div className='mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center'>
			<div className='flex size-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'>
				<Wrench className='size-7' />
			</div>

			<h1 className='mt-6 font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
				<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
					En mantenimiento
				</span>
			</h1>

			<p className='mt-4 max-w-md text-muted-foreground'>
				Estamos aplicando mejoras en Sandy Studio. La aplicación volverá a estar disponible en
				cuanto terminemos.
			</p>

			<p className='mt-2 max-w-md text-muted-foreground text-sm'>
				Tu configuración y tus cuentas conectadas no se ven afectadas.
			</p>

			
		</div>
	);
}
