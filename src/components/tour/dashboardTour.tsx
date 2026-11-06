'use client';
import {
	Box,
	Coffee,
	Mic,
	Palette,
	PanelLeft,
	SlidersHorizontal,
	Smile,
	Sparkles,
	Tv,
} from 'lucide-react';
import type { Tour } from 'nextstepjs';
export const DASHBOARD_TOUR_STORAGE_KEY = 'sandy-studio-tour-v3-seen';
export const dashboardTourSteps: Tour[] = [
	{
		tour: 'dashboard-tour',
		steps: [
			{
				title: 'Tu estudio de emisión',
				selector: '#studio-tour-header',
				icon: <Tv className='size-4' />,
				content:
					'El estudio es tu nueva pantalla de inicio. Aquí controlas el avatar, la voz y la emisión.',
			},
			{
				title: 'PNGTuber, Avatar 2D y Avatar 3D',
				selector: '#studio-tour-formats',
				icon: <Box className='size-4' />,
				content:
					'Cambia de formato desde estas pestañas. Carga tus imágenes PNG, tu modelo Live2D o tu archivo VRM directamente en el navegador.',
			},
			{
				title: 'Herramientas del avatar',
				selector: '#studio-tour-avatar',
				icon: <Smile className='size-4' />,
				content:
					'Activa y apaga las expresiones desde Avatar y asigna atajos a las que más uses. En VRM también encontrarás idle y nodos activables.',
			},
			{
				title: 'Emociones que puede elegir la IA',
				selector: '#studio-tour-reactions',
				icon: <Sparkles className='size-4' />,
				content:
					'Activa solo las emociones que quieras permitir a la IA. Asigna expresiones del modelo y arrastra la ventana de edición desde su encabezado para probarlas sin tapar el avatar.',
			},
			{
				title: 'Habla con tu VTuber',
				selector: '#studio-tour-voice',
				icon: <Mic className='size-4' />,
				content:
					'El micrófono siempre está a mano en el dock. Abre este control para hablar con tu VTuber. La prueba de lip sync está en Opciones avanzadas.',
			},
			{
				title: 'Fondo y encuadre',
				selector: '#studio-tour-scene',
				icon: <Palette className='size-4' />,
				content:
					'Escenario agrupa el fondo y la cámara. Prepara tu encuadre y copia el enlace del overlay para OBS desde el visor.',
			},
			{
				title: 'Inicia la emisión',
				selector: '#studio-tour-services',
				icon: <SlidersHorizontal className='size-4' />,
				content:
					'Este acceso fijo abre los servicios para iniciar o detener la interacción de Sandy con el chat. Las funciones secundarias están en Opciones avanzadas.',
			},
			{
				title: 'Novedades y apoyo',
				selector: '#studio-tour-community',
				icon: <Coffee className='size-4' />,
				content:
					'Consulta las novedades y encuentra el enlace de apoyo voluntario en Ko-fi desde el estudio.',
			},
			{
				title: 'El resto de tu configuración',
				selector: '#studio-tour-navigation',
				icon: <PanelLeft className='size-4' />,
				content:
					'Abre el menú lateral para ir a Conexiones, Recompensas, Moderación, Configuración y Cuenta. El estudio seguirá siendo tu punto de partida.',
			},
		].map((step) => ({
			...step,
			side: 'bottom' as const,
			showControls: true,
			showSkip: true,
			pointerPadding: 8,
			pointerRadius: 12,
			selectorRetryAttempts: 12,
		})),
	},
];
