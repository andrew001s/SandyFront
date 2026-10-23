'use client';

import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { Avatar2dTransform, PngTuberConfig } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Props {
	config: PngTuberConfig;
	onTransformChange?: (transform: Avatar2dTransform) => void;
	interactive?: boolean;
}

export function PngTuberRenderer({ config, onTransformChange, interactive = true }: Props) {
	const [isSpeaking, setIsSpeaking] = useState(avatar2dManager.getIsSpeaking());
	const [isBlinking, setIsBlinking] = useState(false);
	const [dragPosition, setDragPosition] = useState({
		x: config.transform.x,
		y: config.transform.y,
	});
	const [scale, setScale] = useState(config.transform.scale || 1);

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

	// Manejo de zoom con la rueda del ratón
	const handleWheel = (e: React.WheelEvent) => {
		if (!interactive) return;
		e.preventDefault();
		const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
		const nextScale = Math.min(Math.max(scale * zoomFactor, 0.4), 2.5);
		setScale(nextScale);
		onTransformChange?.({
			x: dragPosition.x,
			y: dragPosition.y,
			scale: nextScale,
			rotation: 0,
		});
	};

	const { bounceAmount, bounceSpeed, breathing } = config.physics;

	return (
		<div
			onWheel={handleWheel}
			className='relative flex h-full w-full items-center justify-center overflow-hidden'
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
						width={480}
						height={520}
						unoptimized
						priority
						draggable={false}
						className='pointer-events-none max-h-[460px] max-w-[420px] select-none object-contain drop-shadow-2xl sm:max-h-[520px] sm:max-w-[480px]'
					/>
				</motion.div>
			</motion.div>
		</div>
	);
}
