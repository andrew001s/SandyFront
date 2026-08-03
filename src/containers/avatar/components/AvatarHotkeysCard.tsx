import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VTSHotkey } from '@/hooks/useVTubeStudio';
import { FiZap } from 'react-icons/fi';

type AvatarHotkeysCardProps = {
	connected: boolean;
	hotkeys: VTSHotkey[];
	onTriggerHotkey: (key: string) => undefined | Promise<boolean>;
};

export function AvatarHotkeysCard({ connected, hotkeys, onTriggerHotkey }: AvatarHotkeysCardProps) {
	if (!connected) {
		return null;
	}

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<FiZap size={18} className='text-chart-1' />
					Hotkeys
				</CardTitle>
				<CardDescription>Activá los atajos configurados en el modelo</CardDescription>
			</CardHeader>
			<CardContent>
				{hotkeys.length === 0 ? (
					<p className='py-2 text-center text-muted-foreground text-xs'>
						El modelo activo no tiene hotkeys configurados.
					</p>
				) : (
					<div className='flex max-h-44 flex-wrap gap-2 overflow-y-auto'>
						{hotkeys.map((hotkey) => (
							<Button
								key={hotkey.hotkeyID}
								size='sm'
								variant='outline'
								onClick={() => {
									void onTriggerHotkey(hotkey.hotkeyID);
								}}
							>
								{hotkey.name}
							</Button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
