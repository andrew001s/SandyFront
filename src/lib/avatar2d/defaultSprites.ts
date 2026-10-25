/**
 * Sprites oficiales predeterminados para Sandy PNGTuber (100% nítidos y transparentes en OBS)
 */

export const DEFAULT_SANDY_SPRITES = {
	idle: '/avatars/sandy/sandy_idle.png',
	speaking: '/avatars/sandy/sandy_speaking.png',
	blink: '/avatars/sandy/sandy_blink.png',
	speakingBlink: '/avatars/sandy/sandy_blink.png',
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
		idle: '/avatars/sandy/sandy_happy.png',
		speaking: '/avatars/sandy/sandy_happy_speaking.png',
		blink: DEFAULT_SANDY_SPRITES.blink,
	},
	{
		id: 'surprised',
		label: 'Sorpresa / ¡Oh!',
		idle: '/avatars/sandy/sandy_surprised.png',
		speaking: '/avatars/sandy/sandy_surprised_speaking.png',
		blink: DEFAULT_SANDY_SPRITES.blink,
	},
	{
		id: 'angry',
		label: 'Puchero / Enojada',
		idle: '/avatars/sandy/sandy_angry.png',
		speaking: '/avatars/sandy/sandy_angry_speaking.png',
		blink: DEFAULT_SANDY_SPRITES.blink,
	},
];
