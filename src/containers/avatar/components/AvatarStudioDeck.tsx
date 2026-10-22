'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { VTSExpression, VTSHotkey, VTSModelInfo } from '@/hooks/useVTubeStudio';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiCheck, FiLayers, FiMove, FiRotateCcw, FiSliders, FiSmile, FiZap } from 'react-icons/fi';

type PositionState = {
	positionX: number;
	positionY: number;
	rotation: number;
	size: number;
};

type MoveOptions = {
	positionX?: number;
	positionY?: number;
	rotation?: number;
	size?: number;
	timeInSeconds?: number;
	valuesAreRelativeToModel?: boolean;
};

type AvatarStudioDeckProps = {
	connected: boolean;
	currentModel: VTSModelInfo | null;
	expressions: VTSExpression[];
	hotkeys: VTSHotkey[];
	onSetExpression: (nameOrFile: string, active: boolean) => undefined | Promise<boolean>;
	onTriggerHotkey: (key: string) => undefined | Promise<boolean>;
	onMoveModel: (opts: MoveOptions) => void | Promise<void>;
};

const FIELDS: {
	key: keyof PositionState;
	label: string;
	min: number;
	max: number;
	step: number;
}[] = [
	{ key: 'positionX', label: 'Posición X', min: -1, max: 1, step: 0.01 },
	{ key: 'positionY', label: 'Posición Y', min: -1, max: 1, step: 0.01 },
	{ key: 'rotation', label: 'Rotación', min: -180, max: 180, step: 1 },
	{ key: 'size', label: 'Escala', min: -100, max: 100, step: 0.5 },
];

function SliderField({
	id,
	label,
	value,
	min,
	max,
	step,
	disabled,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	disabled?: boolean;
	onChange: (value: number) => void;
}) {
	return (
		<div className='space-y-1.5 rounded-lg border border-border/50 bg-background/40 p-2.5'>
			<div className='flex items-center justify-between'>
				<label htmlFor={id} className='font-medium text-foreground text-xs'>
					{label}
				</label>
				<span className='font-mono text-muted-foreground text-xs'>{value.toFixed(2)}</span>
			</div>
			<input
				id={id}
				type='range'
				min={min}
				max={max}
				step={step}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(Number(event.target.value))}
				className='h-1.5 w-full cursor-pointer accent-primary'
			/>
		</div>
	);
}

export function AvatarStudioDeck({
	connected,
	currentModel,
	expressions,
	hotkeys,
	onSetExpression,
	onTriggerHotkey,
	onMoveModel,
}: AvatarStudioDeckProps) {
	const [activeTab, setActiveTab] = useState('expressions');
	const [position, setPosition] = useState<PositionState>({
		positionX: 0,
		positionY: 0,
		rotation: 0,
		size: -30,
	});
	const originalRef = useRef<PositionState>(position);
	const valuesRef = useRef<PositionState>(position);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (currentModel) {
			const next = { ...currentModel.modelPosition };
			setPosition(next);
			valuesRef.current = next;
			originalRef.current = next;
		}
	}, [currentModel]);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const scheduleMove = useCallback(
		(next: PositionState) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => {
				void onMoveModel({
					positionX: next.positionX,
					positionY: next.positionY,
					rotation: next.rotation,
					size: next.size,
					timeInSeconds: 0.1,
				});
			}, 120);
		},
		[onMoveModel],
	);

	const updateValue = useCallback(
		(key: keyof PositionState, value: number) => {
			const next = { ...valuesRef.current, [key]: value };
			valuesRef.current = next;
			setPosition(next);
			scheduleMove(next);
		},
		[scheduleMove],
	);

	const resetPosition = useCallback(() => {
		const original = originalRef.current;
		valuesRef.current = original;
		setPosition(original);
		if (timerRef.current) clearTimeout(timerRef.current);
		void onMoveModel({
			positionX: original.positionX,
			positionY: original.positionY,
			rotation: original.rotation,
			size: original.size,
			timeInSeconds: 0.3,
		});
	}, [onMoveModel]);

	const disabled = !connected || !currentModel;

	return (
		<Card className='rounded-xl border-border/60 bg-card'>
			<CardHeader className='pb-3'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-primary/10 p-2 text-primary'>
							<FiSliders className='size-5' />
						</div>
						<div>
							<CardTitle className='font-display font-semibold text-base text-foreground'>
								Controles en Vivo del Modelo
							</CardTitle>
							<CardDescription className='font-sans text-muted-foreground text-xs'>
								Expresiones faciales, atajos de teclado y calibración espacial
							</CardDescription>
						</div>
					</div>

					{connected && currentModel && (
						<Badge variant='outline' className='font-mono text-[10px] text-muted-foreground'>
							{currentModel.modelName}
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{!connected ? (
					<div className='flex flex-col items-center justify-center rounded-xl border border-border/60 border-dashed bg-background/30 p-8 text-center'>
						<div className='mb-3 flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground'>
							<FiLayers size={18} />
						</div>
						<h4 className='font-display font-medium text-foreground text-sm'>
							Controles en espera de conexión
						</h4>
						<p className='mt-1 max-w-sm text-muted-foreground text-xs leading-relaxed'>
							Conecta VTube Studio para activar el disparador de expresiones faciales, hotkeys y
							calibración espacial en vivo.
						</p>
					</div>
				) : !currentModel ? (
					<div className='flex flex-col items-center justify-center rounded-xl border border-border/60 border-dashed bg-background/30 p-8 text-center'>
						<div className='mb-3 flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground'>
							<FiSmile size={18} />
						</div>
						<h4 className='font-display font-medium text-foreground text-sm'>
							Ningún modelo activo seleccionado
						</h4>
						<p className='mt-1 max-w-sm text-muted-foreground text-xs leading-relaxed'>
							Carga un modelo en VTube Studio o elígelo en la biblioteca para habilitar sus
							expresiones y atajos.
						</p>
					</div>
				) : (
					<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
						<TabsList className='grid h-9 w-full grid-cols-3 rounded-lg bg-muted/60 p-1'>
							<TabsTrigger
								value='expressions'
								className='flex items-center justify-center gap-1.5 text-xs'
							>
								<FiSmile size={13} />
								<span>Expresiones</span>
								<Badge variant='secondary' className='h-4 px-1 text-[9px]'>
									{expressions.length}
								</Badge>
							</TabsTrigger>

							<TabsTrigger
								value='hotkeys'
								className='flex items-center justify-center gap-1.5 text-xs'
							>
								<FiZap size={13} />
								<span>Atajos</span>
								<Badge variant='secondary' className='h-4 px-1 text-[9px]'>
									{hotkeys.length}
								</Badge>
							</TabsTrigger>

							<TabsTrigger
								value='position'
								className='flex items-center justify-center gap-1.5 text-xs'
							>
								<FiMove size={13} />
								<span>Posición</span>
							</TabsTrigger>
						</TabsList>

						{/* Pestaña: Expresiones */}
						<TabsContent value='expressions' className='mt-3 space-y-3'>
							{expressions.length === 0 ? (
								<p className='rounded-lg border border-border/40 bg-background/30 py-6 text-center text-muted-foreground text-xs'>
									El modelo activo no tiene archivos de expresión (.exp3.json) configurados.
								</p>
							) : (
								<div className='grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3'>
									{expressions.map((expression) => (
										<Button
											key={expression.file}
											size='sm'
											variant={expression.active ? 'default' : 'outline'}
											onClick={() => {
												void onSetExpression(expression.file, !expression.active);
											}}
											className={cn(
												'h-9 justify-start gap-1.5 truncate px-2.5 font-medium text-xs transition-colors',
												expression.active && 'shadow-xs ring-1 ring-primary/40',
											)}
										>
											{expression.active ? (
												<FiCheck size={12} className='shrink-0 text-primary-foreground' />
											) : (
												<FiSmile size={12} className='shrink-0 text-muted-foreground' />
											)}
											<span className='truncate'>{expression.name}</span>
										</Button>
									))}
								</div>
							)}
						</TabsContent>

						{/* Pestaña: Atajos (Hotkeys) */}
						<TabsContent value='hotkeys' className='mt-3 space-y-3'>
							{hotkeys.length === 0 ? (
								<p className='rounded-lg border border-border/40 bg-background/30 py-6 text-center text-muted-foreground text-xs'>
									El modelo activo no tiene hotkeys configurados en VTube Studio.
								</p>
							) : (
								<div className='grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3'>
									{hotkeys.map((hotkey) => (
										<Button
											key={hotkey.hotkeyID}
											size='sm'
											variant='outline'
											onClick={() => {
												void onTriggerHotkey(hotkey.hotkeyID);
											}}
											className='h-9 justify-start gap-1.5 truncate border-border/70 px-2.5 font-medium text-xs hover:border-primary/50'
										>
											<FiZap size={12} className='shrink-0 text-amber-400' />
											<span className='truncate'>{hotkey.name}</span>
										</Button>
									))}
								</div>
							)}
						</TabsContent>

						{/* Pestaña: Posición y Escala */}
						<TabsContent value='position' className='mt-3 space-y-3'>
							<div className='flex items-center justify-between pb-1 text-xs'>
								<span className='text-muted-foreground'>Calibración espacial en vivo</span>
								<Button
									variant='ghost'
									size='sm'
									className='h-7 gap-1 px-2 text-xs'
									disabled={disabled}
									onClick={() => resetPosition()}
								>
									<FiRotateCcw size={12} />
									Restaurar
								</Button>
							</div>

							<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
								{FIELDS.map((field) => (
									<SliderField
										key={field.key}
										id={field.key}
										label={field.label}
										value={position[field.key]}
										min={field.min}
										max={field.max}
										step={field.step}
										disabled={disabled}
										onChange={(value) => updateValue(field.key, value)}
									/>
								))}
							</div>
						</TabsContent>
					</Tabs>
				)}
			</CardContent>
		</Card>
	);
}
