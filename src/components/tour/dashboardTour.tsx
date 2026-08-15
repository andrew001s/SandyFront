'use client';

import type { Tour } from 'nextstepjs';
import {
	CircleUserRound,
	LayoutDashboard,
	Plug,
	Settings2,
	ShieldCheck,
	Tv,
} from 'lucide-react';

export const DASHBOARD_TOUR_STORAGE_KEY = 'sandy-dashboard-tour-seen';

export const dashboardTourSteps: Tour[] = [
	{
		tour: 'dashboard-tour',
		steps: [
			{
				icon: <LayoutDashboard className='size-4' />,
				title: 'Tu dashboard',
				content: (
					<>
						Aquí ves el estado general de Sandy y los accesos rápidos para operar sin salir del panel.
					</>
				),
				selector: '#home-tour-overview',
				side: 'bottom',
				showControls: true,
				showSkip: true,
				pointerPadding: 12,
				pointerRadius: 14,
				selectorRetryAttempts: 8,
			},
			{
				icon: <LayoutDashboard className='size-4' />,
				title: 'Controles principales',
				content: (
					<>
						Desde esta sección enciendes las funciones clave del sistema y revisas el panel de control.
					</>
				),
				selector: '#home-tour-controls',
				side: 'top',
				showControls: true,
				showSkip: true,
				pointerPadding: 12,
				pointerRadius: 14,
				selectorRetryAttempts: 8,
			},
			{
				icon: <Plug className='size-4' />,
				title: 'Conexiones',
				content: (
					<>
						Usa esta pestaña para conectar Twitch, Kick y YouTube y centralizar la interacción con tu comunidad.
					</>
				),
				selector: '#sidebar-tour-conexiones',
				side: 'right',
				showControls: true,
				showSkip: true,
				pointerPadding: 10,
				pointerRadius: 12,
				selectorRetryAttempts: 8,
			},
			{
				icon: <ShieldCheck className='size-4' />,
				title: 'Moderación',
				content: (
					<>
						Aquí puedes controlar filtros, bloqueos y reglas para mantener limpio el chat.
					</>
				),
				selector: '#sidebar-tour-moderacion',
				side: 'right',
				showControls: true,
				showSkip: true,
				pointerPadding: 10,
				pointerRadius: 12,
				selectorRetryAttempts: 8,
			},
			{
				icon: <Tv className='size-4' />,
				title: 'VTube Studio',
				content: (
					<>
						Esta pestaña conecta el avatar con Sandy para mover boca y expresiones en tiempo real.
					</>
				),
				selector: '#sidebar-tour-avatar',
				side: 'right',
				showControls: true,
				showSkip: true,
				pointerPadding: 10,
				pointerRadius: 12,
				selectorRetryAttempts: 8,
			},
			{
				icon: <Settings2 className='size-4' />,
				title: 'Configuración',
				content: (
					<>
						Ajusta voz, IA, reconocimiento y detalles finos del comportamiento desde esta sección.
					</>
				),
				selector: '#sidebar-tour-settings',
				side: 'right',
				showControls: true,
				showSkip: true,
				pointerPadding: 10,
				pointerRadius: 12,
				selectorRetryAttempts: 8,
			},
			{
				icon: <CircleUserRound className='size-4' />,
				title: 'Tu cuenta',
				content: (
					<>
						Desde aquí revisas tus datos de acceso y la información de tu perfil.
					</>
				),
				selector: '#sidebar-tour-account',
				side: 'right',
				showControls: true,
				showSkip: true,
				pointerPadding: 10,
				pointerRadius: 12,
				selectorRetryAttempts: 8,
			},
		],
	},
];
