'use client';

import dynamic from 'next/dynamic';

const Dictaphone = dynamic(() => import('../Speech/Dictaphone.client'), {
	ssr: false,
	loading: () => <p>Cargando reconocimiento de voz...</p>,
});

const Switchs = () => {
	return (
		<div className='flex items-center space-x-3 pt-4'>
			<Dictaphone />
		</div>
	);
};

export default Switchs;
