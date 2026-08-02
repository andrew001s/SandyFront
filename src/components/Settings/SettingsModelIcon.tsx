import { getOpenRouterModelIconUrl } from '@/components/Settings/settings.constants';
import { Bot } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type SettingsModelIconProps = {
	modelId: string;
};

export function SettingsModelIcon({ modelId }: SettingsModelIconProps) {
	const [failed, setFailed] = useState(false);
	const iconUrl = getOpenRouterModelIconUrl(modelId);

	if (!iconUrl || failed) {
		return (
			<div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80'>
				<Bot className='size-3.5 text-violet-600 dark:text-[#A78BFA]' />
			</div>
		);
	}

	return (
		<div className='flex size-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80'>
			<Image
				src={iconUrl}
				alt=''
				width={48}
				height={48}
				quality={100}
				loading='lazy'
				onError={() => setFailed(true)}
				className='size-12 object-contain'
			/>
		</div>
	);
}
