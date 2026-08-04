'use client';

import { useEffect } from 'react';
import { useRollbar } from '@rollbar/react';

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const rollbar = useRollbar();

	useEffect(() => {
		rollbar.error(error);
	}, [error, rollbar]);

	return (
		<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center'>
			<h2 className='font-semibold text-2xl'>Algo salió mal</h2>
			<p className='max-w-md text-muted-foreground text-sm'>
				Se registró el error en Rollbar y ya podemos revisarlo.
			</p>
			<button
				type='button'
				onClick={() => reset()}
				className='rounded-md bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-90'
			>
				Intentar otra vez
			</button>
		</div>
	);
}
