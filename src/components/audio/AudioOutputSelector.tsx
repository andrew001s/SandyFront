'use client';
import { Button } from '@/components/ui/button';
import { useAudioOutputDevices } from '@/hooks/useAudioOutputDevices';
import { Copy, Headphones, Info, Play, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
	className?: string;
	showTips?: boolean;
}

export function AudioOutputSelector({ className = '', showTips = true }: Props) {
	const {
		devices,
		primarySinkId,
		mirrorSinkId,
		isSupported,
		hasPermission,
		setPrimarySink,
		setMirrorSink,
		requestPermission,
		testDevice,
	} = useAudioOutputDevices();

	const [enableMirror, setEnableMirror] = useState<boolean>(Boolean(mirrorSinkId));

	if (!isSupported) {
		return null;
	}

	const handlePrimaryChange = (val: string) => {
		void setPrimarySink(val);
		const match = devices.find((d) => d.deviceId === val);
		toast.success(`Salida principal: ${match?.label || 'Por defecto'}`);
	};

	const handleMirrorChange = (val: string) => {
		void setMirrorSink(val);
		const match = devices.find((d) => d.deviceId === val);
		toast.success(`Salida secundaria (espejo): ${match?.label || 'Ninguna'}`);
	};

	const handleToggleMirror = (checked: boolean) => {
		setEnableMirror(checked);
		if (!checked) {
			void setMirrorSink('');
			toast.info('Salida secundaria desactivada');
		} else if (devices.length > 0) {
			// Intentar sugerir un dispositivo virtual o el segundo dispositivo
			const virtual = devices.find(
				(d) =>
					d.label.toLowerCase().includes('cable') ||
					d.label.toLowerCase().includes('virtual') ||
					d.label.toLowerCase().includes('voicemeeter'),
			);
			const target = virtual?.deviceId || devices[1]?.deviceId || devices[0]?.deviceId || '';
			if (target) {
				void setMirrorSink(target);
			}
		}
	};

	return (
		<div
			className={`space-y-3 rounded-xl border border-border/60 bg-background/50 p-3.5 ${className}`}
		>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Volume2 className='size-4 text-primary' />
					<span className='font-medium text-foreground text-xs'>Salida de Audio del Navegador</span>
				</div>
				{!hasPermission && (
					<Button
						variant='ghost'
						size='sm'
						onClick={() => void requestPermission()}
						className='h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground'
					>
						Mostrar nombres de dispositivos
					</Button>
				)}
			</div>

			{/* Salida Principal */}
			<div className='space-y-1.5'>
				<div className='flex items-center justify-between text-xs'>
					<label
						htmlFor='audio-primary-sink'
						className='flex items-center gap-1.5 font-medium text-muted-foreground text-xs'
					>
						<Headphones className='size-3.5 text-muted-foreground' />
						Dispositivo principal (tus auriculares / altavoces)
					</label>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => {
							void testDevice(primarySinkId);
							toast.info('Reproduciendo tono de prueba en salida principal...');
						}}
						className='h-5 gap-1 px-1.5 font-mono text-[10px] text-primary hover:bg-primary/10'
						title='Probar audio'
					>
						<Play className='size-2.5' /> Probar
					</Button>
				</div>

				<select
					id='audio-primary-sink'
					value={primarySinkId}
					onChange={(e) => handlePrimaryChange(e.target.value)}
					className='h-9 w-full rounded-lg border border-border/70 bg-card px-2.5 font-medium text-foreground text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary'
				>
					<option value=''>Por defecto del sistema</option>
					{devices.map((device) => (
						<option key={device.deviceId} value={device.deviceId}>
							{device.label}
						</option>
					))}
				</select>
			</div>

			{/* Checkbox para duplicar a fuente virtual para Lip Sync en VNyan / VSeeFace */}
			<div className='border-border/40 border-t pt-2.5'>
				<label className='flex cursor-pointer items-center justify-between gap-2 text-xs'>
					<span className='flex items-center gap-1.5 font-medium text-foreground'>
						<Copy className='size-3.5 text-cyan-400' />
						Duplicar salida a fuente virtual (para Lip Sync 3D)
					</span>
					<input
						type='checkbox'
						checked={enableMirror}
						onChange={(e) => handleToggleMirror(e.target.checked)}
						className='size-4 rounded border-border text-primary accent-primary'
					/>
				</label>

				{enableMirror && (
					<div className='mt-2.5 space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-xs'>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-cyan-400 text-xs'>
								Dispositivo secundario (ej. VB-Cable / Virtual)
							</span>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => {
									if (mirrorSinkId) {
										void testDevice(mirrorSinkId);
										toast.info('Reproduciendo tono en salida secundaria...');
									}
								}}
								disabled={!mirrorSinkId}
								className='h-5 gap-1 px-1.5 font-mono text-[10px] text-cyan-400 hover:bg-cyan-500/10'
							>
								<Play className='size-2.5' /> Probar
							</Button>
						</div>

						<select
							value={mirrorSinkId}
							onChange={(e) => handleMirrorChange(e.target.value)}
							className='h-8 w-full rounded-lg border border-cyan-500/30 bg-card px-2 text-foreground text-xs outline-none focus:border-cyan-400'
						>
							<option value=''>Selecciona dispositivo (ej. CABLE Input)...</option>
							{devices.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</select>

						{showTips && (
							<div className='flex items-start gap-1.5 text-[11px] text-muted-foreground'>
								<Info className='mt-0.5 size-3 shrink-0 text-cyan-400' />
								<span>
									En <strong>VNyan</strong> o <strong>VSeeFace</strong>, selecciona este mismo
									dispositivo como tu <em>Micrófono</em> en Ajustes de Audio. Sandy enviará su voz
									allí para mover la boca en tiempo real sin silenciar tus auriculares.
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
