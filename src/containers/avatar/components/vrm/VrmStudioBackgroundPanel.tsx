'use client';

import { Button } from '@/components/ui/button';
import {
	DEFAULT_VRM_BACKGROUND_STATE,
	VRM_BACKGROUND_PRESETS,
	type VrmBackgroundPresetId,
	type VrmBackgroundState,
	fileToDataUrl,
} from '@/lib/avatar/vrmBackground';
import {
	Check,
	Image as ImageIcon,
	Palette,
	RotateCcw,
	Sliders,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	state: VrmBackgroundState;
	onChange: (next: VrmBackgroundState) => void;
	onClose: () => void;
}

export function VrmStudioBackgroundPanel({ state, onChange, onClose }: Props) {
	const [activeTab, setActiveTab] = useState<'presets' | 'color' | 'image'>(
		state.mode === 'image' ? 'image' : state.mode === 'color' ? 'color' : 'presets',
	);
	const [tempColor, setTempColor] = useState<string>(state.customColor || '#18181b');
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleSelectPreset = (presetId: VrmBackgroundPresetId) => {
		const next: VrmBackgroundState = {
			...state,
			mode: 'preset',
			presetId,
		};
		onChange(next);
		const match = VRM_BACKGROUND_PRESETS.find((p) => p.id === presetId);
		toast.success(`Fondo cambiado a: ${match?.label || presetId}`);
	};

	const handleCustomColor = (colorHex: string) => {
		setTempColor(colorHex);
		const next: VrmBackgroundState = {
			...state,
			mode: 'color',
			customColor: colorHex,
		};
		onChange(next);
	};

	const handleImageUpload = async (file: File) => {
		if (!file.type.startsWith('image/')) {
			toast.error('Por favor selecciona un archivo de imagen válido (.png, .jpg, .webp)');
			return;
		}

		try {
			toast.loading('Cargando imagen de fondo...', { id: 'bg-img-upload' });
			const dataUrl = await fileToDataUrl(file);
			const next: VrmBackgroundState = {
				...state,
				mode: 'image',
				imageUrl: dataUrl,
				imageName: file.name,
			};
			onChange(next);
			setActiveTab('image');
			toast.success(`Imagen "${file.name}" cargada como fondo`, { id: 'bg-img-upload' });
		} catch {
			toast.error('No se pudo cargar la imagen', { id: 'bg-img-upload' });
		}
	};

	const handleClearImage = () => {
		const next: VrmBackgroundState = {
			...state,
			mode: 'preset',
			imageUrl: null,
			imageName: undefined,
		};
		onChange(next);
		setActiveTab('presets');
		toast.info('Imagen de fondo eliminada');
	};

	const handleResetDefault = () => {
		onChange(DEFAULT_VRM_BACKGROUND_STATE);
		setActiveTab('presets');
		toast.info('Fondo restablecido a Estudio Oscuro');
	};

	return (
		<div className='flex w-84 max-w-[calc(100vw-3rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-92'>
			{/* Encabezado */}
			<div className='flex items-center justify-between border-border/60 border-b pb-2.5'>
				<div className='flex items-center gap-2'>
					<div className='rounded-lg bg-primary/20 p-1.5 text-primary'>
						<Palette className='size-4' />
					</div>
					<div>
						<h3 className='font-bold font-display text-foreground text-sm tracking-tight'>
							Fondo y Escenario
						</h3>
						<p className='text-[10px] text-muted-foreground'>
							Color sólido, croma para OBS o imagen propia
						</p>
					</div>
				</div>

				<div className='flex items-center gap-1'>
					<Button
						variant='ghost'
						size='icon'
						onClick={handleResetDefault}
						className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
						title='Restablecer fondo por defecto'
					>
						<RotateCcw className='size-3.5' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>
			</div>

			{/* Pestañas de Modo */}
			<div className='grid grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 text-xs'>
				<button
					type='button'
					onClick={() => setActiveTab('presets')}
					className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-all ${
						activeTab === 'presets'
							? 'bg-card text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<Palette className='size-3' /> Presets
				</button>
				<button
					type='button'
					onClick={() => {
						setActiveTab('color');
						if (state.mode !== 'color') {
							onChange({ ...state, mode: 'color', customColor: tempColor });
						}
					}}
					className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-all ${
						activeTab === 'color'
							? 'bg-card text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<Sliders className='size-3' /> Color
				</button>
				<button
					type='button'
					onClick={() => {
						setActiveTab('image');
						if (state.imageUrl && state.mode !== 'image') {
							onChange({ ...state, mode: 'image' });
						}
					}}
					className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-all ${
						activeTab === 'image'
							? 'bg-card text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<ImageIcon className='size-3' /> Imagen
				</button>
			</div>

			{/* Vista: Presets de Color */}
			{activeTab === 'presets' && (
				<div className='space-y-2'>
					<div className='grid max-h-[260px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5'>
						{VRM_BACKGROUND_PRESETS.map((preset) => {
							const isCurrent = state.mode === 'preset' && state.presetId === preset.id;
							return (
								<button
									key={preset.id}
									type='button'
									onClick={() => handleSelectPreset(preset.id)}
									className={`group flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
										isCurrent
											? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
											: 'border-border/60 bg-card/40 hover:border-border hover:bg-card/80'
									}`}
								>
									<div
										className='size-7 shrink-0 rounded-lg border border-white/20 shadow-xs'
										style={preset.swatchStyle}
									/>
									<div className='min-w-0 flex-1'>
										<div className='flex items-center justify-between'>
											<span className='truncate font-medium text-foreground text-xs'>
												{preset.label}
											</span>
											{isCurrent && <Check className='size-3 shrink-0 text-primary' />}
										</div>
										<p className='truncate text-[10px] text-muted-foreground'>
											{preset.id === 'chroma-green' ||
											preset.id === 'chroma-blue' ||
											preset.id === 'chroma-magenta'
												? 'OBS Chroma'
												: preset.id === 'checker'
													? 'Transparente'
													: 'Color'}
										</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Vista: Selector de Color Personalizado */}
			{activeTab === 'color' && (
				<div className='space-y-3 rounded-xl border border-border/60 bg-card/40 p-3'>
					<div className='space-y-1.5'>
						<label htmlFor='custom-color-input' className='font-medium text-foreground text-xs'>
							Color de fondo personalizado
						</label>
						<p className='text-[11px] text-muted-foreground'>
							Elige cualquier tono HEX o RGB con el selector nativo
						</p>
					</div>

					<div className='flex items-center gap-2.5'>
						<div className='relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/80 shadow-xs'>
							<input
								id='custom-color-picker'
								type='color'
								value={tempColor}
								onChange={(e) => handleCustomColor(e.target.value)}
								className='-inset-2 absolute size-14 cursor-pointer border-0 p-0'
							/>
						</div>

						<input
							id='custom-color-input'
							type='text'
							value={tempColor}
							onChange={(e) => handleCustomColor(e.target.value)}
							placeholder='#18181b'
							className='h-9 flex-1 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs uppercase'
						/>
					</div>

					{/* Paleta rápida de colores populares para VTubers */}
					<div className='space-y-1.5 pt-1'>
						<span className='font-medium text-[11px] text-muted-foreground'>
							Colores populares:
						</span>
						<div className='flex flex-wrap gap-1.5'>
							{[
								'#0f172a',
								'#18181b',
								'#00FF00',
								'#0000FF',
								'#FF00FF',
								'#3b82f6',
								'#ec4899',
								'#10b981',
								'#f59e0b',
								'#ffffff',
								'#000000',
							].map((hex) => (
								<button
									key={hex}
									type='button'
									onClick={() => handleCustomColor(hex)}
									style={{ backgroundColor: hex }}
									className={`size-6 rounded-md border border-white/20 transition-transform hover:scale-110 ${
										tempColor.toLowerCase() === hex.toLowerCase()
											? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
											: ''
									}`}
									title={hex}
								/>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Vista: Imagen de Fondo */}
			{activeTab === 'image' && (
				<div className='space-y-3'>
					{state.imageUrl ? (
						<div className='space-y-3 rounded-xl border border-border/60 bg-card/40 p-3'>
							{/* Miniatura previa */}
							<div className='relative h-28 w-full overflow-hidden rounded-xl border border-border/60 bg-background'>
								<Image
									src={state.imageUrl}
									alt='Fondo personalizado'
									fill
									className='object-cover'
									unoptimized
								/>
								<div className='absolute inset-x-0 bottom-0 bg-black/70 p-1.5 backdrop-blur-xs'>
									<p className='truncate font-mono text-[10px] text-white'>
										{state.imageName || 'Imagen de fondo cargada'}
									</p>
								</div>
							</div>

							{/* Opciones de la Imagen */}
							<div className='space-y-2.5 text-xs'>
								{/* Ajuste Cover / Contain */}
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground'>Ajuste:</span>
									<div className='flex rounded-lg border border-border/60 bg-muted/40 p-0.5 text-[11px]'>
										<button
											type='button'
											onClick={() => onChange({ ...state, mode: 'image', imageFit: 'cover' })}
											className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
												state.imageFit === 'cover'
													? 'bg-card text-foreground shadow-xs'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											Cubrir (Cover)
										</button>
										<button
											type='button'
											onClick={() => onChange({ ...state, mode: 'image', imageFit: 'contain' })}
											className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
												state.imageFit === 'contain'
													? 'bg-card text-foreground shadow-xs'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											Ajustar (Contain)
										</button>
									</div>
								</div>

								{/* Atenuación oscura de brillo */}
								<div className='space-y-1'>
									<div className='flex items-center justify-between text-[11px]'>
										<span className='text-muted-foreground'>Atenuación oscura:</span>
										<span className='font-medium font-mono text-foreground'>
											{Math.round(state.imageDim * 100)}%
										</span>
									</div>
									<input
										type='range'
										min='0'
										max='0.8'
										step='0.05'
										value={state.imageDim}
										onChange={(e) =>
											onChange({ ...state, mode: 'image', imageDim: Number(e.target.value) })
										}
										className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
									/>
								</div>

								{/* Desenfoque de fondo */}
								<div className='space-y-1'>
									<div className='flex items-center justify-between text-[11px]'>
										<span className='text-muted-foreground'>Desenfoque de fondo:</span>
										<span className='font-medium font-mono text-foreground'>
											{state.imageBlur}px
										</span>
									</div>
									<input
										type='range'
										min='0'
										max='16'
										step='1'
										value={state.imageBlur}
										onChange={(e) =>
											onChange({
												...state,
												mode: 'image',
												imageBlur: Number(e.target.value),
											})
										}
										className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
									/>
								</div>
							</div>

							<div className='flex items-center justify-between gap-2 border-border/60 border-t pt-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => fileInputRef.current?.click()}
									className='h-7.5 gap-1.5 text-xs'
								>
									<Upload className='size-3' /> Cambiar imagen
								</Button>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleClearImage}
									className='h-7.5 gap-1 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive'
								>
									<Trash2 className='size-3' /> Quitar imagen
								</Button>
							</div>
						</div>
					) : (
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => e.preventDefault()}
							onDrop={(e) => {
								e.preventDefault();
								const file = e.dataTransfer.files?.[0];
								if (file) void handleImageUpload(file);
							}}
							className='flex w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-border/70 border-dashed bg-card/40 p-6 text-center transition-colors hover:border-primary/50 hover:bg-card/70'
						>
							<div className='rounded-full bg-primary/10 p-3 text-primary'>
								<Upload className='size-5' />
							</div>
							<div className='space-y-1'>
								<p className='font-medium text-foreground text-xs'>
									Subir imagen de fondo personalizada
								</p>
								<p className='text-[10px] text-muted-foreground'>
									PNG, JPG o WEBP · Arrastra y suelta aquí
								</p>
							</div>
							<span className='inline-flex h-7 items-center gap-1.5 rounded-md bg-secondary px-3 font-medium text-secondary-foreground text-xs'>
								<ImageIcon className='size-3' /> Seleccionar imagen
							</span>
						</button>
					)}

					<input
						ref={fileInputRef}
						type='file'
						accept='image/png,image/jpeg,image/webp,image/svg+xml'
						className='hidden'
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) void handleImageUpload(file);
						}}
					/>
				</div>
			)}
		</div>
	);
}
