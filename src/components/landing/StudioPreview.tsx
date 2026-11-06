'use client';

import Image from 'next/image';
import { useState } from 'react';

const expressions = [
	{ name: 'Neutral', image: '/avatars/sandy/sandy_idle.png' },
	{ name: 'Alegría', image: '/avatars/sandy/sandy_happy.png' },
	{ name: 'Sorpresa', image: '/avatars/sandy/sandy_surprised.png' },
];

export function StudioPreview() {
	const [selected, setSelected] = useState(expressions[0]);
	return (
		<div data-ui='true' className='overflow-hidden rounded-lg border border-border bg-background'>
			<div className='flex items-center justify-between gap-2 border-border border-b px-3 py-2 text-xs'>
				<span className='font-medium'>Prueba una expresión</span>
				<span className='text-muted-foreground'>Demo PNGTuber</span>
			</div>
			<div className='flex justify-center bg-muted/30 pt-3'>
				<Image
					src={selected.image}
					alt={`Sandy: ${selected.name}`}
					width={120}
					height={160}
					className='h-40 w-auto object-contain'
				/>
			</div>
			<div className='flex flex-wrap justify-center gap-1.5 p-2'>
				{expressions.map((expression) => (
					<button
						key={expression.name}
						type='button'
						aria-pressed={selected.name === expression.name}
						onClick={() => setSelected(expression)}
						className={`min-h-11 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary ${selected.name === expression.name ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}
					>
						{expression.name}
					</button>
				))}
			</div>
		</div>
	);
}
