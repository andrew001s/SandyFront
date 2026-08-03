'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VTSModelInfo } from '@/hooks/useVTubeStudio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiMove, FiRotateCcw } from 'react-icons/fi';

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

type AvatarModelPositionCardProps = {
	connected: boolean;
	currentModel: VTSModelInfo | null;
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
		<div className='space-y-1'>
			<div className='flex items-center justify-between'>
				<label htmlFor={id} className='text-muted-foreground text-xs'>
					{label}
				</label>
				<span className='font-mono text-foreground text-xs'>{value.toFixed(2)}</span>
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
				className='h-1.5 w-full cursor-pointer accent-[var(--chart-1)]'
			/>
		</div>
	);
}

export function AvatarModelPositionCard({
	connected,
	currentModel,
	onMoveModel,
}: AvatarModelPositionCardProps) {
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
	}, [currentModel?.modelID]);

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

	const reset = useCallback(() => {
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
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader className='flex-row items-center justify-between space-y-0'>
				<div>
					<CardTitle className='flex items-center gap-2 text-lg'>
						<FiMove size={18} className='text-chart-1' />
						Posición y escala
					</CardTitle>
					<CardDescription>Ajustá el modelo en tiempo real</CardDescription>
				</div>
				<Button
					variant='ghost'
					size='sm'
					className='gap-1.5'
					disabled={disabled}
					onClick={() => reset()}
				>
					<FiRotateCcw size={13} />
					Restaurar
				</Button>
			</CardHeader>
			<CardContent>
				{!currentModel ? (
					<p className='py-2 text-center text-muted-foreground text-xs'>
						Cargá un modelo para ajustar su posición.
					</p>
				) : (
					<div className='space-y-4'>
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
				)}
			</CardContent>
		</Card>
	);
}
