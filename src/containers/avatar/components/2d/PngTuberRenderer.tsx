'use client';

import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { Avatar2dTransform, PngTuberConfig } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface Props {
	config: PngTuberConfig;
	onTransformChange?: (transform: Avatar2dTransform) => void;
	interactive?: boolean;
}

export function PngTuberRenderer({ config, onTransformChange, interactive = true }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isSpeaking, setIsSpeaking] = useState(avatar2dManager.getIsSpeaking());
	const [isBlinking, setIsBlinking] = useState(false);
	const [dragPosition, setDragPosition] = useState({
		x: config.transform.x,
		y: config.transform.y,
	});
	const [scale, setScale] = useState(config.transform.scale || 1);

	const dragPositionRef = useRef(dragPosition);
	dragPositionRef.current = dragPosition;

	const scaleRef = useRef(scale);
	scaleRef.current = scale;

	// Sincronizar speaking con el manager
	useEffect(() => {
		const unsub = avatar2dManager.subscribeSpeaking((speaking) => {
			setIsSpeaking(speaking);
		});
		return () => unsub();
	}, []);

	// Sincronizar transform externo
	useEffect(() => {
		setDragPosition({ x: config.transform.x, y: config.transform.y });
		setScale(config.transform.scale || 1);
	}, [config.transform.x, config.transform.y, config.transform.scale]);

	// Zoom fluido con rueda del ratón SIN que haga scroll la página entera
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !interactive) return;

		const onWheel = (e: WheelEvent) => {
			// Evitar que la página web se desplace verticalmente
			e.preventDefault();
			e.stopPropagation();

			const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
			const nextScale = Math.min(Math.max(scaleRef.current * zoomFactor, 0.4), 2.5);
			const currentPos = dragPositionRef.current;

			setScale(nextScale);
			onTransformChange?.({
				x: currentPos.x,
				y: currentPos.y,
				scale: nextScale,
				rotation: 0,
			});
		};

		container.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', onWheel);
		};
	}, [interactive, onTransformChange]);

	// Temporizador de parpadeo automático
	useEffect(() => {
		let blinkTimeout: NodeJS.Timeout;

		const triggerBlink = () => {
			setIsBlinking(true);
			blinkTimeout = setTimeout(() => {
				setIsBlinking(false);
			}, 160);
		};

		const intervalId = setInterval(triggerBlink, config.physics.blinkInterval || 3800);

		return () => {
			clearInterval(intervalId);
			clearTimeout(blinkTimeout);
		};
	}, [config.physics.blinkInterval]);

	// Determinar el sprite activo según emoción, habla y parpadeo
	const { activeEmotion, emotions, sprites } = config;
	const isCustomEmotion = Boolean(activeEmotion && activeEmotion !== 'neutral');
	const currentEmotionObj = isCustomEmotion ? emotions.find((e) => e.id === activeEmotion) : null;

	let activeSprite = sprites.idle;

	if (isSpeaking) {
		if (isBlinking) {
			activeSprite =
				currentEmotionObj?.blink ||
				sprites.speakingBlink ||
				currentEmotionObj?.speaking ||
				sprites.speaking;
		} else {
			activeSprite = currentEmotionObj?.speaking || sprites.speaking;
		}
	} else {
		if (isBlinking) {
			activeSprite = currentEmotionObj?.blink || sprites.blink || sprites.idle;
		} else {
			activeSprite = currentEmotionObj?.idle || sprites.idle;
		}
	}

	const { bounceAmount, bounceSpeed, breathing } = config.physics;

	return (
		<div
			ref={containerRef}
			className='relative flex h-full w-full touch-none select-none items-center justify-center overflow-hidden overscroll-contain'
		>
			<motion.div
				drag={interactive}
				dragMomentum={false}
				onDragEnd={(_e, info) => {
					const nextX = dragPosition.x + info.offset.x;
					const nextY = dragPosition.y + info.offset.y;
					setDragPosition({ x: nextX, y: nextY });
					onTransformChange?.({
						x: nextX,
						y: nextY,
						scale,
						rotation: 0,
					});
				}}
				animate={{
					x: dragPosition.x,
					y: dragPosition.y + (isSpeaking ? -bounceAmount : 0),
					scale: isSpeaking ? scale * 1.02 : scale,
				}}
				transition={{
					type: 'spring',
					stiffness: Math.max(150, 600 - bounceSpeed),
					damping: 20,
					mass: 0.8,
				}}
				className={`relative select-none ${
					interactive ? 'cursor-grab active:cursor-grabbing' : ''
				}`}
			>
				{/* Animación opcional de respiración suave en reposo */}
				<motion.div
					animate={
						breathing && !isSpeaking
							? {
									scaleY: [1, 1.015, 1],
									y: [0, -2, 0],
								}
							: {}
					}
					transition={{
						duration: 2.8,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
					className='relative flex items-center justify-center'
				>
					<Image
						src={activeSprite}
						alt='Avatar 2D PNGTuber'
						width={520}
						height={560}
						unoptimized
						priority
						draggable={false}
						className='pointer-events-none max-h-[min(82vh,780px)] max-w-[min(90vw,720px)] select-none object-contain drop-shadow-2xl'
					/>
				</motion.div>
			</motion.div>
		</div>
	);
}
