'use client';

import type { DropdownOption } from '@/components/Settings/settings.types';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown } from 'lucide-react';
import { Select } from 'radix-ui';
import { useId } from 'react';
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
	const id = useId();
	return (
		<div className={className}>
			{!hideLabel && (
				<Label htmlFor={id} className='mb-2 block'>
					{label}
				</Label>
			)}
			<Select.Root
				value={value}
				open={open}
				onOpenChange={setOpen}
				onValueChange={(next) => {
					onChange(next);
					onRefresh?.();
				}}
			>
				<Select.Trigger
					id={id}
					aria-label={label}
					className='flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring'
				>
					<span className='min-w-0 truncate'>
						<Select.Value placeholder={placeholder} />
					</span>
					<Select.Icon>
						<ChevronDown aria-hidden='true' className='size-4 text-muted-foreground' />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content
						position='popper'
						sideOffset={4}
						collisionPadding={12}
						className='z-[100] max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md'
					>
						<Select.Viewport className='max-h-80 p-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]'>
							{options
								.filter((option) => option.value !== '')
								.map((option) => (
									<Select.Item
										key={option.value}
										value={option.value}
										className='relative flex min-h-11 cursor-pointer items-center gap-2 rounded-md py-2 pr-8 pl-3 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground'
									>
										{option.flag && (
											<ReactCountryFlag
												aria-hidden='true'
												countryCode={option.flag}
												svg
												className='size-4 shrink-0'
											/>
										)}
										<Select.ItemText>{option.label}</Select.ItemText>
										<Select.ItemIndicator className='absolute right-2'>
											<Check aria-hidden='true' className='size-4' />
										</Select.ItemIndicator>
									</Select.Item>
								))}
						</Select.Viewport>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</div>
	);
}
