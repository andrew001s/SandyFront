/**
 * Sprites vectoriales predeterminados para Sandy PNGTuber (100% nítidos y transparentes en OBS)
 */

function createSandySvg(options: {
	mouth: 'closed' | 'open' | 'o' | 'pout';
	eyes: 'open' | 'blink' | 'happy' | 'angry';
	blush?: boolean;
}): string {
	const { mouth, eyes, blush = true } = options;

	// Render de ojos
	let eyesSvg = '';
	if (eyes === 'open') {
		eyesSvg = `
			<!-- Ojo Derecho (Cyan) -->
			<ellipse cx="160" cy="205" rx="16" ry="24" fill="#0284c7" />
			<ellipse cx="160" cy="205" rx="14" ry="22" fill="#38bdf8" />
			<ellipse cx="155" cy="195" rx="6" ry="9" fill="#ffffff" />
			<circle cx="166" cy="215" r="3.5" fill="#ffffff" />
			
			<!-- Ojo Izquierdo (Coral / Rojo) -->
			<ellipse cx="240" cy="205" rx="16" ry="24" fill="#be123c" />
			<ellipse cx="240" cy="205" rx="14" ry="22" fill="#fb7185" />
			<ellipse cx="235" cy="195" rx="6" ry="9" fill="#ffffff" />
			<circle cx="246" cy="215" r="3.5" fill="#ffffff" />
		`;
	} else if (eyes === 'blink' || eyes === 'happy') {
		eyesSvg = `
			<!-- Ojos cerrados sonrientes en arco -->
			<path d="M 144 205 Q 160 190 176 205" stroke="#1e1b4b" stroke-width="4.5" stroke-linecap="round" fill="none" />
			<path d="M 224 205 Q 240 190 256 205" stroke="#1e1b4b" stroke-width="4.5" stroke-linecap="round" fill="none" />
		`;
	} else if (eyes === 'angry') {
		eyesSvg = `
			<!-- Ojos decididos / enojados -->
			<ellipse cx="160" cy="205" rx="15" ry="20" fill="#38bdf8" />
			<ellipse cx="240" cy="205" rx="15" ry="20" fill="#fb7185" />
			<path d="M 142 188 L 176 198" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" />
			<path d="M 258 188 L 224 198" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" />
		`;
	}

	// Render de boca
	let mouthSvg = '';
	if (mouth === 'closed') {
		mouthSvg = `
			<!-- Boca cerrada estilo gato :3 -->
			<path d="M 190 236 Q 195 242 200 237 Q 205 242 210 236" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round" fill="none" />
		`;
	} else if (mouth === 'open') {
		mouthSvg = `
			<!-- Boca abierta hablando -->
			<path d="M 188 234 Q 200 230 212 234 Q 200 258 188 234 Z" fill="#e11d48" stroke="#1e1b4b" stroke-width="2.5" />
			<path d="M 193 246 Q 200 240 207 246 Q 200 256 193 246 Z" fill="#fda4af" />
		`;
	} else if (mouth === 'o') {
		mouthSvg = `
			<!-- Boca redonda O -->
			<ellipse cx="200" cy="242" rx="7" ry="10" fill="#e11d48" stroke="#1e1b4b" stroke-width="2.5" />
		`;
	} else {
		mouthSvg = `
			<!-- Boca puchero -->
			<path d="M 192 242 Q 200 236 208 242" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round" fill="none" />
		`;
	}

	// Rubor en mejillas
	const blushSvg = blush
		? `
			<ellipse cx="145" cy="222" rx="12" ry="6" fill="#f43f5e" opacity="0.35" />
			<ellipse cx="255" cy="222" rx="12" ry="6" fill="#f43f5e" opacity="0.35" />
		`
		: '';

	const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="100%" height="100%">
		<defs>
			<filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
				<feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.18" />
			</filter>
		</defs>
		
		<g filter="url(#soft-shadow)">
			<!-- Pelo trasero -->
			<path d="M 100 170 Q 70 300 110 380 Q 200 410 290 380 Q 330 300 300 170 Z" fill="#18181b" />
			<path d="M 80 230 Q 60 330 110 400 Q 140 410 130 360 Z" fill="#18181b" />
			<path d="M 320 230 Q 340 330 290 400 Q 260 410 270 360 Z" fill="#18181b" />

			<!-- Cuerpo / Vestido Gótico Lolita con mangas abullonadas -->
			<path d="M 140 330 L 110 430 L 290 430 L 260 330 Z" fill="#18181b" />
			<!-- Mangas blancas -->
			<circle cx="120" cy="360" r="28" fill="#f8fafc" />
			<circle cx="280" cy="360" r="28" fill="#f8fafc" />
			<path d="M 120 380 Q 120 420 135 440 L 155 430 Z" fill="#fecdd3" opacity="0.9" />
			<path d="M 280 380 Q 280 420 265 440 L 245 430 Z" fill="#fecdd3" opacity="0.9" />
			
			<!-- Cuello y pecho -->
			<path d="M 165 310 L 200 335 L 235 310 L 200 350 Z" fill="#ffffff" />
			<!-- Moño rosa / rojo -->
			<path d="M 200 330 L 180 320 L 180 340 Z" fill="#f43f5e" />
			<path d="M 200 330 L 220 320 L 220 340 Z" fill="#f43f5e" />
			<circle cx="200" cy="330" r="6" fill="#be123c" />
			<path d="M 196 334 L 188 355 L 198 348 L 204 355 Z" fill="#f43f5e" />

			<!-- Cabeza / Piel -->
			<path d="M 120 180 Q 120 280 200 285 Q 280 280 280 180 Q 280 100 200 100 Q 120 100 120 180 Z" fill="#fff1f2" />

			<!-- Ojos -->
			${eyesSvg}

			<!-- Rubor -->
			${blushSvg}

			<!-- Boca -->
			${mouthSvg}

			<!-- Pelo Frontal / Flequillo -->
			<!-- Mechón Izquierdo con reflejo Coral -->
			<path d="M 120 150 Q 110 220 135 250 Q 145 220 140 180 Z" fill="#18181b" />
			<path d="M 125 170 Q 120 230 138 245 Q 140 215 135 185 Z" fill="#fb7185" />

			<!-- Flequillo central -->
			<path d="M 140 120 Q 170 170 180 205 Q 185 160 200 130 Z" fill="#18181b" />
			<path d="M 190 125 Q 210 170 215 200 Q 225 155 240 125 Z" fill="#18181b" />

			<!-- Mechón Derecho con reflejo Cyan -->
			<path d="M 280 150 Q 290 220 265 250 Q 255 220 260 180 Z" fill="#18181b" />
			<path d="M 275 170 Q 280 230 262 245 Q 260 215 265 185 Z" fill="#38bdf8" />

			<!-- Parte superior del pelo / Ahoge -->
			<path d="M 110 160 Q 200 60 290 160 Q 270 90 200 85 Q 130 90 110 160 Z" fill="#18181b" />
			<path d="M 200 90 Q 215 50 195 40 Q 185 60 198 88 Z" fill="#18181b" />

			<!-- Horquilla Trébol Verde de 4 hojas -->
			<g transform="translate(262, 140)">
				<circle cx="0" cy="-6" r="5" fill="#22c55e" />
				<circle cx="6" cy="0" r="5" fill="#22c55e" />
				<circle cx="0" cy="6" r="5" fill="#22c55e" />
				<circle cx="-6" cy="0" r="5" fill="#22c55e" />
				<circle cx="0" cy="0" r="3" fill="#15803d" />
				<path d="M 0 3 Q 4 14 8 16" stroke="#15803d" stroke-width="2" fill="none" stroke-linecap="round" />
			</g>
		</g>
	</svg>`;

	return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const DEFAULT_SANDY_SPRITES = {
	idle: createSandySvg({ mouth: 'closed', eyes: 'open' }),
	speaking: createSandySvg({ mouth: 'open', eyes: 'open' }),
	blink: createSandySvg({ mouth: 'closed', eyes: 'blink' }),
	speakingBlink: createSandySvg({ mouth: 'open', eyes: 'blink' }),
};

export const DEFAULT_SANDY_EMOTIONS = [
	{
		id: 'neutral',
		label: 'Neutral',
		idle: DEFAULT_SANDY_SPRITES.idle,
		speaking: DEFAULT_SANDY_SPRITES.speaking,
		blink: DEFAULT_SANDY_SPRITES.blink,
	},
	{
		id: 'happy',
		label: 'Feliz / Radiante',
		idle: createSandySvg({ mouth: 'closed', eyes: 'happy' }),
		speaking: createSandySvg({ mouth: 'open', eyes: 'happy' }),
		blink: createSandySvg({ mouth: 'closed', eyes: 'blink' }),
	},
	{
		id: 'surprised',
		label: 'Sorpresa / ¡Oh!',
		idle: createSandySvg({ mouth: 'o', eyes: 'open' }),
		speaking: createSandySvg({ mouth: 'open', eyes: 'open' }),
		blink: createSandySvg({ mouth: 'o', eyes: 'blink' }),
	},
	{
		id: 'angry',
		label: 'Puchero / Enojada',
		idle: createSandySvg({ mouth: 'pout', eyes: 'angry' }),
		speaking: createSandySvg({ mouth: 'open', eyes: 'angry' }),
		blink: createSandySvg({ mouth: 'pout', eyes: 'blink' }),
	},
];
