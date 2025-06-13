import { useEffect, useState } from 'react';

export const TwitchCallback = () => {
	const [message, setMessage] = useState('Procesando autenticación...');
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

	useEffect(() => {
		const handleCallback = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const error = urlParams.get('error');
			const errorDescription = urlParams.get('error_description');

			if (error) {
				setStatus('error');
				setMessage(`Error: ${errorDescription || error}`);
				window.opener?.postMessage(
					{
						type: 'TWITCH_AUTH_ERROR',
						error: errorDescription || error,
					},
					window.location.origin,
				);
				return;
			}
			if (code) {
				localStorage.setItem('twitch_auth_code', code);
				localStorage.setItem('twitch_auth_timestamp', Date.now().toString());

				if (window.opener) {
					window.opener.postMessage({ type: 'TWITCH_AUTH_CALLBACK', code }, window.location.origin);
				}

				setStatus('success');
				setMessage(
					'¡Autenticación exitosa! Ya puedes volver a la aplicación, esta información se transferirá automáticamente.',
				);
			} else {
				setStatus('error');
				setMessage('Error: No se recibió código de autorización.');
			}
		};

		handleCallback();
	}, []);
	return (
		<div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700'>
			<div className='rounded-lg bg-white/10 p-8 text-center backdrop-blur-sm'>
				<h1
					className={`mb-4 font-bold text-2xl ${
						status === 'error'
							? 'text-red-400'
							: status === 'success'
								? 'text-green-400'
								: 'text-white'
					}`}
				>
					{status === 'error' ? '⚠️ Error' : status === 'success' ? '✅ Éxito' : '⌛ Procesando'}
				</h1>{' '}
				<p className='text-white/90'>{message}</p>
				{status === 'success' && (
					<button
						type='button'
						onClick={() => window.close()}
						className='mt-4 rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700'
					>
						Cerrar Pestaña
					</button>
				)}
			</div>
		</div>
	);
};

export default TwitchCallback;
