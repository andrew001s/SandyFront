'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import Rollbar from 'rollbar';
import { clientRollbarConfig } from '@/lib/rollbar-client';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		posthog.captureException(error);
		const rollbar = new Rollbar(clientRollbarConfig);

		rollbar.error(error);
	}, [error]);

	return (
		<html lang='es'>
			<body className='flex min-h-screen items-center justify-center bg-background px-6 text-center'>
				<div className='flex max-w-md flex-col gap-4'>
					<h2 className='font-semibold text-2xl'>Se produjo un error global</h2>
					<p className='text-muted-foreground text-sm'>
						Rollbar recibió el incidente y el equipo puede revisarlo.
					</p>
					<button
						type='button'
						onClick={() => reset()}
						className='rounded-md bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-90'
					>
						Intentar otra vez
					</button>
				</div>
			</body>
		</html>
	);
}
