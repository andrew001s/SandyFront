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

export const KickCallback = () => {
	const [message, setMessage] = useState('Procesando autenticación de Kick...');
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

	useEffect(() => {
		const handleCallback = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const error = urlParams.get('error');
			const errorDescription = urlParams.get('error_description');
			const state = urlParams.get('state');

			if (error) {
				setStatus('error');
				setMessage(`Error: ${errorDescription || error}`);
				window.opener?.postMessage(
					{
						type: 'KICK_AUTH_ERROR',
						error: errorDescription || error,
					},
					window.location.origin,
				);
				return;
			}

			if (code) {
				if (window.opener) {
					window.opener.postMessage(
						{ type: 'KICK_AUTH_CALLBACK', code, state },
						window.location.origin,
					);
				}

				setStatus('success');
				setMessage('¡Autenticación exitosa! Ya puedes volver a la aplicación.');
				return;
			}

			setStatus('error');
			setMessage('Error: No se recibió código de autorización.');
		};

		handleCallback();
	}, []);

	return (
		<motion.div
			className='flex min-h-screen items-center justify-center bg-background px-4 py-10'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8 }}
		>
			<BackgroundGradient className='rounded-[22px] bg-background p-1'>
				<motion.div
					className='rounded-lg border border-border/60 bg-card p-8 text-center text-card-foreground backdrop-blur-sm'
					variants={containerVariants}
					initial='hidden'
					animate='visible'
					exit='exit'
				>
					<motion.h1
						variants={itemVariants}
						className={`mb-4 font-bold text-2xl ${
							status === 'error'
								? 'text-destructive'
								: status === 'success'
									? 'text-emerald-500 dark:text-emerald-400'
									: 'text-foreground'
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
								{status === 'error' ? 'Kick: error' : status === 'success' ? 'Kick: listo' : 'Kick: procesando'}
							</motion.span>
						</AnimatePresence>
					</motion.h1>
					<motion.p variants={itemVariants} className='text-muted-foreground'>
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
								className='mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90'
							>
								Cerrar pestaña
							</motion.button>
						)}
					</AnimatePresence>
				</motion.div>
			</BackgroundGradient>
		</motion.div>
	);
};

export default KickCallback;
