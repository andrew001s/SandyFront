'use client';

import { useWatermarkFree } from '@/context/SupportPurchaseContext';
import { KOFI_URL } from '@/lib/links';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './SupportWatermark.module.css';

export const SUPPORT_WATERMARK_TIMING = {
	firstAppearanceMs: 30_000,
	intervalMs: 180_000,
	visibleMs: 10_000,
} as const;

export function SupportWatermark({ dockVisible = false }: { dockVisible?: boolean }) {
	const watermarkFree = useWatermarkFree();
	const [visible, setVisible] = useState(false);
	const linkRef = useRef<HTMLAnchorElement>(null);
	const expiresAt = useRef(0);
	const previousPermission = useRef(watermarkFree);

	useEffect(() => {
		const revoked = previousPermission.current && !watermarkFree;
		previousPermission.current = watermarkFree;
		if (watermarkFree) {
			setVisible(false);
			return;
		}
		let showTimer: ReturnType<typeof setTimeout>;
		let hideTimer: ReturnType<typeof setTimeout>;
		const show = () => {
			expiresAt.current = Date.now() + SUPPORT_WATERMARK_TIMING.visibleMs;
			setVisible(true);
			hideTimer = setTimeout(() => {
				if (!linkRef.current?.contains(document.activeElement)) setVisible(false);
			}, SUPPORT_WATERMARK_TIMING.visibleMs);
			showTimer = setTimeout(show, SUPPORT_WATERMARK_TIMING.intervalMs);
		};
		if (revoked) show();
		else showTimer = setTimeout(show, SUPPORT_WATERMARK_TIMING.firstAppearanceMs);
		return () => {
			clearTimeout(showTimer);
			clearTimeout(hideTimer);
		};
	}, [watermarkFree]);

	if (!visible || watermarkFree) return null;

	return (
		<div className={`${styles.root} ${dockVisible ? styles.withDock : ''}`} data-support-watermark>
			<a
				ref={linkRef}
				href={KOFI_URL}
				target='_blank'
				rel='noopener noreferrer'
				aria-label='Apoya Sandy Studio en Ko-fi (se abre en otra pestaña)'
				className={styles.visit}
				onBlur={() => {
					if (Date.now() >= expiresAt.current) setVisible(false);
				}}
			>
				<picture className={styles.mascot}>
					<source
						media='(prefers-reduced-motion: reduce)'
						srcSet='/support/sandy-coffee-still.png'
					/>
					<Image
						src='/support/sandy-coffee.gif'
						alt=''
						width={128}
						height={128}
						unoptimized
						draggable={false}
					/>
				</picture>
				<span className={styles.bubble}>
					<strong className={styles.title}>¿Me invitas un café?</strong>
					<span className={styles.message}>Apoya el proyecto con un café o un aporte.</span>
					<span className={styles.link}>
						ko-fi.com/shandrew <ArrowUpRight size={13} aria-hidden />
					</span>
				</span>
			</a>
		</div>
	);
}
