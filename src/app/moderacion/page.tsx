import { ModerationPanel } from '@/components/Moderation/ModerationPanel';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { ShieldCheck } from 'lucide-react';

export default function ModeracionPage() {
	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
				<header className='mb-8'>
					<span className='mb-3 inline-flex items-center gap-2 font-semibold text-violet-600 text-xs uppercase tracking-[0.25em] dark:text-[#A78BFA]'>
						<ShieldCheck size={12} className='text-emerald-500 dark:text-emerald-400' />
						Moderación
					</span>
					<h1 className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
						<span className='bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#34D399]'>
							Moderación
						</span>
					</h1>
					<p className='mt-2 max-w-xl text-muted-foreground'>
						Define qué palabras, símbolos y enlaces debe bloquear Sandy Studio en los mensajes.
					</p>
				</header>

				<ModerationPanel />
			</div>
		</DashboardShell>
	);
}
