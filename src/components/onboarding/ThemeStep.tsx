'use client';

import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { StepProps } from './onboarding.types';
import { useOnboardingDraft } from './useOnboardingDraft';

export function ThemeStep({ payload }: StepProps) {
	const { data, update } = useOnboardingDraft();
	const { resolvedTheme, setTheme } = useTheme();
	const selected = data.uiTheme ?? resolvedTheme ?? 'dark';
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<fieldset aria-label='Tema de la interfaz' className='grid gap-4 sm:grid-cols-2'>
				{(['light', 'dark'] as const).map((theme) => {
					const active = selected === theme;
					const light = theme === 'light';
					return (
						<button
							key={theme}
							type='button'
							aria-pressed={active}
							aria-label={light ? 'Claro' : 'Oscuro'}
							onClick={() => {
								setTheme(theme);
								void update({ uiTheme: theme });
							}}
							className={`min-w-0 overflow-hidden rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}
						>
							<div
								aria-hidden='true'
								className={`relative aspect-[4/3] overflow-hidden rounded-lg border ${light ? 'border-[#d8d4ec] bg-[#f4f3fa]' : 'border-[#262a4d] bg-[#0e1022]'}`}
							>
								<div
									className={`flex h-8 items-center justify-between border-b px-3 ${light ? 'border-[#d8d4ec] bg-white' : 'border-[#262a4d] bg-[#141733]'}`}
								>
									<span
										className={`font-bold font-display text-xs ${light ? 'text-[#16182e]' : 'text-[#e9e6f5]'}`}
									>
										Sandy Studio
									</span>
									<span
										className={`size-2 rounded-full ${light ? 'bg-[#6b5ce7]' : 'bg-[#8c7cff]'}`}
									/>
								</div>
								<div
									className={`absolute inset-x-3 top-11 bottom-3 overflow-hidden rounded-lg border ${light ? 'border-[#d8d4ec] bg-white' : 'border-[#262a4d] bg-[#141733]'}`}
								>
									<Image
										src='/avatars/sandy/sandy_idle.png'
										alt=''
										width={180}
										height={240}
										className='-translate-x-1/2 absolute bottom-0 left-1/2 h-[90%] w-auto object-contain'
									/>
									<div
										className={`absolute top-2 right-2 flex w-7 flex-col items-center gap-2 rounded-lg border py-2 ${light ? 'border-[#d8d4ec] bg-[#f4f3fa] text-[#434063]' : 'border-[#262a4d] bg-[#0e1022] text-[#9a98b8]'}`}
									>
										<Sun className='size-3' />
										<Moon className='size-3' />
										<span
											className={`size-2 rounded-full ${light ? 'bg-[#6b5ce7]' : 'bg-[#8c7cff]'}`}
										/>
									</div>
								</div>
							</div>
							<span className='mt-4 flex items-center justify-between gap-2 px-1'>
								<span className='flex items-center gap-2 font-semibold'>
									{light ? <Sun className='size-4' /> : <Moon className='size-4' />}
									{light ? 'Claro' : 'Oscuro'}
								</span>
								{active && <Check aria-hidden='true' className='size-4 text-primary' />}
							</span>
							<span className='mt-2 block px-1 pb-1 text-muted-foreground text-sm leading-relaxed'>
								{light ? 'Más claro para trabajar de día.' : 'Más suave para sesiones nocturnas.'}
							</span>
						</button>
					);
				})}
			</fieldset>
			<p className='text-muted-foreground text-sm'>
				La vista previa usa a Sandy para mostrar el contraste de cada tema. Puedes cambiarlo después
				desde el estudio.
			</p>
		</OnboardingStepFrame>
	);
}
