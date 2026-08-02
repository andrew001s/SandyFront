import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { type DropdownOption } from '@/components/Settings/settings.types';
import ReactCountryFlag from 'react-country-flag';

type SettingsDropdownFieldProps = {
	label: string;
	placeholder: string;
	value: string;
	options: DropdownOption[];
	open: boolean;
	setOpen: (open: boolean) => void;
	onChange: (value: string) => void;
	onRefresh?: () => void;
	className?: string;
	hideLabel?: boolean;
};

export function SettingsDropdownField({
	label,
	placeholder,
	value,
	options,
	open,
	setOpen,
	onChange,
	onRefresh,
	className,
	hideLabel,
}: SettingsDropdownFieldProps) {
	const selected = options.find((option) => option.value === value);
	const selectedLabel = selected?.label ?? placeholder;

	return (
		<div className={className}>
			{hideLabel ? null : <Label className='mb-2 block'>{label}</Label>}
			<div className='relative'>
				<Button
					type='button'
					variant='outline'
					onClick={() => setOpen(!open)}
					className='h-9 w-full justify-between bg-card/80 text-left'
				>
					<span className='flex min-w-0 items-center gap-2'>
						{selected?.flag ? (
							<ReactCountryFlag
								countryCode={selected.flag}
								svg
								className='size-5 shrink-0 rounded-full object-cover'
							/>
						) : null}
						<span className='truncate'>{selectedLabel}</span>
					</span>
					<span className='text-muted-foreground'>⌄</span>
				</Button>
				{open ? (
					<div className='absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-xl'>
						{options.map((option) => (
							<button
								key={option.value}
								type='button'
								onClick={() => {
									onChange(option.value);
									setOpen(false);
									onRefresh?.();
								}}
								className={[
									'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors',
									option.value === value
										? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
										: 'text-foreground hover:bg-accent hover:text-accent-foreground',
								].join(' ')}
							>
								<span className='flex min-w-0 items-center gap-2'>
									{option.flag ? (
										<ReactCountryFlag
											countryCode={option.flag}
											svg
											className='size-5 shrink-0 rounded-full object-cover'
										/>
									) : null}
									<span className='truncate'>{option.label}</span>
								</span>
								{option.value === value ? <span>●</span> : null}
							</button>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}
