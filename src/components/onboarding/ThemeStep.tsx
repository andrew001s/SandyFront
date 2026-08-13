'use client';

import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import type { SandyOnboardingContext, StepProps } from '@/components/onboarding/onboarding.types';
import { useOnboarding } from '@onboardjs/react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

type ThemeOption = 'light' | 'dark';

const themeOptions: Array<{
	id: ThemeOption;
	label: string;
	description: string;
}> = [
	{
		id: 'light',
		label: 'Light',
		description: 'Más claro y aireado para trabajar de día.',
	},
	{
		id: 'dark',
		label: 'Dark',
		description: 'Más suave para sesiones largas y nocturnas.',
	},
];

export function ThemeStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const { theme, resolvedTheme, setTheme } = useTheme();
	const currentThemePreference = state?.context.flowData?.uiTheme ?? resolvedTheme ?? theme ?? 'dark';
	const currentTheme: ThemeOption = currentThemePreference === 'light' ? 'light' : 'dark';
	const isLightTheme = currentTheme === 'light';

	const handleSelectTheme = (nextTheme: ThemeOption) => {
		setTheme(nextTheme);
		void updateContext({
			flowData: {
				...state?.context.flowData,
				uiTheme: nextTheme,
			},
		});
	};

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<div className='space-y-6'>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{themeOptions.map((option, index) => {
						const selected = currentTheme === option.id;

						return (
							<motion.button
								key={option.id}
								type='button'
								onClick={() => handleSelectTheme(option.id)}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.28, delay: index * 0.05 }}
								whileHover={{ y: -2 }}
								whileTap={{ scale: 0.99 }}
								className={`group relative overflow-hidden rounded-[1.75rem] border p-4 text-left transition-all ${
									selected
										? isLightTheme
											? 'border-cyan-400/50 bg-white shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_24px_60px_rgba(109,91,208,0.08)]'
											: 'border-cyan-400/40 bg-white/[0.05] shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_24px_60px_rgba(0,0,0,0.22)]'
										: isLightTheme
											? 'border-black/10 bg-white/90 hover:border-black/20 hover:bg-white'
											: 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
								}`}
							>
								<div className='absolute top-4 right-4'>
									<span
									className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium text-[10px] uppercase tracking-[0.22em] ${
											selected
												? isLightTheme
													? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-700'
													: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
												: isLightTheme
													? 'border-black/10 bg-black/[0.03] text-zinc-500'
													: 'border-white/10 bg-white/[0.04] text-white/45'
										}`}
									>
										{selected ? 'Activo' : 'Vista previa'}
									</span>
								</div>

								<div
									className={`relative overflow-hidden rounded-[1.35rem] border ${
										option.id === 'light'
											? 'border-slate-200/80 bg-[#f5f7fb]'
											: 'border-white/10 bg-[#101423]'
									}`}
								>
									<div
										className={`relative h-[178px] overflow-hidden ${
											option.id === 'light'
												? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.95),transparent_22%),linear-gradient(180deg,#f9fbff_0%,#eef3fb_100%)]'
												: 'bg-[radial-gradient(circle_at_18%_18%,rgba(139,92,246,0.22),transparent_24%),radial-gradient(circle_at_80%_12%,rgba(34,211,238,0.16),transparent_22%),linear-gradient(180deg,#0f1321_0%,#0b1020_100%)]'
										}`}
									>
										<div
											className={`absolute inset-0 opacity-70 ${
												option.id === 'light'
													? 'bg-[linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:18px_18px]'
													: 'bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:18px_18px]'
											}`}
										/>
										<div
											className={`absolute top-4 left-4 h-2 w-2 rounded-full ${
												option.id === 'light' ? 'bg-violet-500' : 'bg-violet-300'
											}`}
										/>
										<div
											className={`absolute top-4 left-9 h-2 w-10 rounded-full ${
												option.id === 'light' ? 'bg-slate-300' : 'bg-white/10'
											}`}
										/>
										<div
											className={`absolute top-4 left-[4.9rem] h-2 w-6 rounded-full ${
												option.id === 'light' ? 'bg-slate-200' : 'bg-white/8'
											}`}
										/>
										<div
											className={`absolute top-12 left-4 h-[116px] w-[72px] rounded-[1rem] ${
												option.id === 'light' ? 'bg-white shadow-sm' : 'bg-white/5'
											}`}
										/>
										<div className='absolute top-12 right-4 left-[6.5rem] space-y-2'>
											<div className={`h-3 w-24 rounded-full ${option.id === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
											<div className={`h-2.5 w-full rounded-full ${option.id === 'light' ? 'bg-slate-100' : 'bg-white/8'}`} />
											<div className={`h-2.5 w-11/12 rounded-full ${option.id === 'light' ? 'bg-slate-100' : 'bg-white/8'}`} />
											<div className={`h-2.5 w-9/12 rounded-full ${option.id === 'light' ? 'bg-slate-100' : 'bg-white/8'}`} />
											<div className='mt-4 flex gap-2'>
												<div className={`h-7 w-20 rounded-full ${option.id === 'light' ? 'bg-violet-200' : 'bg-violet-500/20'}`} />
												<div className={`h-7 w-16 rounded-full ${option.id === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
											</div>
										</div>

										<div
											className={`absolute inset-x-0 bottom-0 h-14 ${
												option.id === 'light'
													? 'bg-gradient-to-t from-white via-white/80 to-transparent'
													: 'bg-gradient-to-t from-[#0b1020] via-[#0b1020]/80 to-transparent'
											}`}
										/>
									</div>
								</div>

								<div className='mt-4 space-y-1.5'>
									<div className='flex items-center gap-2'>
										{option.id === 'light' ? (
											<Sun className={`size-4 ${isLightTheme ? 'text-amber-500' : 'text-amber-300'}`} />
										) : (
											<Moon className={`size-4 ${isLightTheme ? 'text-cyan-600' : 'text-cyan-200'}`} />
										)}
										<h3 className={`font-semibold text-lg ${isLightTheme ? 'text-zinc-900' : 'text-white'}`}>
											{option.label}
										</h3>
									</div>
									<p className={`max-w-sm text-sm leading-relaxed ${isLightTheme ? 'text-zinc-600' : 'text-white/60'}`}>
										{option.description}
									</p>
								</div>
							</motion.button>
						);
					})}
				</div>

				<p className={`text-center text-sm ${isLightTheme ? 'text-zinc-500' : 'text-white/45'}`}>
					Puedes cambiar el tema después desde Ajustes sin perder el onboarding.
				</p>
			</div>
		</OnboardingStepFrame>
	);
}
