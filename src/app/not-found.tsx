import Link from 'next/link';

export default function NotFound() {
	return (
		<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center'>
			<h1 className='font-bold text-4xl text-foreground sm:text-6xl'>404</h1>
			<h2 className='font-semibold text-2xl text-foreground'>Página no encontrada</h2>
			<p className='max-w-md text-muted-foreground text-sm'>
				La página que buscas no existe o ha sido movida.
			</p>
			<Link
				href='/home'
				className='rounded-md bg-foreground px-4 py-2 font-medium text-background text-sm transition-opacity hover:opacity-90'
			>
				Volver al inicio
			</Link>
		</div>
	);
}
