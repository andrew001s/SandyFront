'use client';
import { AnimatePresence, type Variants, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BackgroundGradient } from '../ui/background-gradient';

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			duration: 0.6,
			ease: [0.43, 0.13, 0.23, 0.96],
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			duration: 0.3,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: [0.43, 0.13, 0.23, 0.96],
		},
	},
	exit: {
		opacity: 0,
		y: -20,
		transition: {
			duration: 0.3,
		},
	},
};

const statusVariants: Variants = {
	hidden: { scale: 0.8, opacity: 0 },
	visible: {
		scale: 1,
		opacity: 1,
		transition: {
			type: 'spring',
			stiffness: 300,
			damping: 24,
		},
	},
	exit: {
		scale: 0.8,
		opacity: 0,
		transition: {
			duration: 0.2,
		},
	},
};

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
		<motion.div
			className='flex min-h-screen items-center justify-center bg-background'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8 }}
		>
			<BackgroundGradient className='rounded-[22px] bg-zinc-900 p-1'>
				<motion.div
					className='rounded-lg bg-zinc-900 p-8 text-center backdrop-blur-sm'
					variants={containerVariants}
					initial='hidden'
					animate='visible'
					exit='exit'
				>
					<motion.h1
						variants={itemVariants}
						className={`mb-4 font-bold text-2xl ${
							status === 'error'
								? 'text-red-400'
								: status === 'success'
									? 'text-green-400'
									: 'text-white'
						}`}
					>
						<AnimatePresence mode='wait'>
							<motion.span
								key={status}
								variants={statusVariants}
								initial='hidden'
								animate='visible'
								exit='exit'
							>
								{status === 'error'
									? '⚠️ Error'
									: status === 'success'
										? '✅ Éxito'
										: '⌛ Procesando'}
							</motion.span>
						</AnimatePresence>
					</motion.h1>
					<motion.p variants={itemVariants} className='text-white/90'>
						{message}
					</motion.p>
					<AnimatePresence mode='wait'>
						{status === 'success' && (
							<motion.button
								variants={itemVariants}
								initial='hidden'
								animate='visible'
								exit='exit'
								type='button'
								onClick={() => window.close()}
								className='mt-4 rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700'
								whileHover={{
									scale: 1.05,
									transition: { duration: 0.2 },
								}}
								whileTap={{
									scale: 0.95,
									transition: { duration: 0.1 },
								}}
							>
								Cerrar Pestaña
							</motion.button>
						)}
					</AnimatePresence>
				</motion.div>
			</BackgroundGradient>
		</motion.div>
	);
};

export default TwitchCallback;
