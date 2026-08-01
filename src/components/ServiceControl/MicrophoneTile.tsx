'use client';

import dynamic from 'next/dynamic';

const Dictaphone = dynamic(() => import('@/components/Speech/Dictaphone.client'), {
	ssr: false,
	loading: () => (
		<div className='flex h-full min-h-40 animate-pulse items-center justify-center rounded-2xl border border-border/60 bg-background/60'>
			<p className='text-muted-foreground text-xs'>Cargando micrófono...</p>
		</div>
	),
});

export function MicrophoneTile() {
	return <Dictaphone variant='tile' />;
}
