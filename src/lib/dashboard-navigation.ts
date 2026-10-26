import { CircleUserRound, Gift, Plug, Settings2, ShieldCheck, Tv } from 'lucide-react';

export const dashboardNavigation = [
	{ href: '/avatar', label: 'Estudio', icon: Tv, tourId: 'sidebar-tour-dashboard' },
	{ href: '/conexiones', label: 'Conexiones', icon: Plug, tourId: 'sidebar-tour-conexiones' },
	{ href: '/recompensas', label: 'Recompensas', icon: Gift, tourId: 'sidebar-tour-recompensas' },
	{
		href: '/moderacion',
		label: 'Moderación',
		icon: ShieldCheck,
		tourId: 'sidebar-tour-moderacion',
	},
	{ href: '/settings', label: 'Configuración', icon: Settings2, tourId: 'sidebar-tour-settings' },
	{ href: '/account', label: 'Cuenta', icon: CircleUserRound, tourId: 'sidebar-tour-account' },
];
