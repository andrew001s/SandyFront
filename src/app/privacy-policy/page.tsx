import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import {
	metadataBase,
	noIndexMetadata,
	sharedDescription,
	sharedOpenGraphImage,
	sharedSiteName,
} from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	...noIndexMetadata,
	metadataBase,
	title: 'Política de Privacidad',
	description: `Conoce cómo ${sharedSiteName} recopila, usa, almacena y protege tus datos personales.`,
	alternates: {
		canonical: '/privacy-policy',
	},
	openGraph: {
		title: `Política de Privacidad | ${sharedSiteName}`,
		description: sharedDescription,
		type: 'website',
		siteName: sharedSiteName,
		url: '/privacy-policy',
		locale: 'es_ES',
		images: [
			{
				url: sharedOpenGraphImage,
				width: 1200,
				height: 630,
				alt: 'Sandy Studio',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		site: '@ElShandrew',
		creator: '@ElShandrew',
		title: `Política de Privacidad | ${sharedSiteName}`,
		description: sharedDescription,
	},
};

const sections: LegalSection[] = [
	{
		id: 'alcance',
		title: 'Alcance',
		body: [
			`${sharedSiteName} es un servicio de automatización y asistencia para VTubers y streamers que se conecta con plataformas como Twitch, Kick y YouTube, genera respuestas mediante modelos de IA y ejecuta acciones de moderación.`,
			`Esta Política de Privacidad describe cómo ${sharedSiteName} recopila, usa, almacena, comparte y protege los datos de los usuarios cuando interactúan con la aplicación, la API y las integraciones con servicios de terceros.`,
			'Al usar el servicio, aceptas el tratamiento de tus datos conforme a esta política.',
		],
	},
	{
		id: 'responsable-del-tratamiento',
		title: 'Responsable del tratamiento',
		body: [
			`El responsable del tratamiento de datos es el operador de ${sharedSiteName}, la persona física o jurídica que despliega y administra el servicio.`,
		],
		list: ['Contacto de privacidad: shandrewcontact@gmail.com'],
	},
	{
		id: 'datos-que-se-recopilan',
		title: 'Datos que se recopilan',
		body: ['El sistema puede recopilar y procesar las siguientes categorías de datos:'],
		subsections: [
			{
				title: 'Datos de autenticación y cuenta',
				list: [
					'Identificador de usuario autenticado proporcionado por Clerk.',
					'Identificador de sesión.',
					'Reclamaciones o atributos básicos del token de sesión cuando sean necesarios para validar acceso.',
					'API keys de Clerk cuando el backend opera con ese formato de autenticación.',
				],
			},
			{
				title: 'Datos de integración con plataformas externas',
				list: [
					'Tokens de acceso y refresh tokens de Twitch.',
					'Tokens de acceso y refresh tokens de Kick.',
					'Tokens de acceso y refresh tokens de YouTube/Google.',
					'Correo electrónico de YouTube, si el proveedor lo devuelve y el backend lo conserva.',
					'Identificadores de cuenta o canal, como twitch_channel, kick_channel, youtube_channel_id, youtube_channel_title, youtube_broadcast_id y youtube_live_chat_id.',
					'Identificadores de suscripciones y eventos de Kick.',
				],
			},
			{
				title: 'Datos de configuración del usuario',
				list: [
					'Preferencias de IA, como proveedor elegido, modelo, prompts personalizados y perfil de personalidad.',
					'Flags de funcionalidad, como respuestas de chat, voz, eventos, recompensas, moderación y asistencia.',
					'Listas personalizadas de palabras, símbolos o enlaces bloqueados.',
					'Configuración de idioma, modo de servicio, auto inicio, auto parada e inactividad.',
					'Claves y parámetros de servicios externos guardados por usuario, cuando aplique.',
				],
			},
			{
				title: 'Datos operativos y de contenido',
				list: [
					'Mensajes de chat recibidos desde Twitch, Kick o YouTube.',
					'Texto enviado a proveedores de IA para generar respuestas o moderación.',
					'Eventos de stream, recompensas, suscripciones, raids y moderación.',
					'Metadatos técnicos de peticiones, respuestas y errores necesarios para operar el servicio.',
				],
			},
		],
	},
	{
		id: 'como-se-usan-los-datos',
		title: 'Cómo se usan los datos',
		body: ['Los datos se usan para:'],
		list: [
			'Verificar identidad y autorizar el acceso al backend.',
			'Guardar y recuperar configuraciones del usuario.',
			'Autenticar y mantener sesiones con Twitch, Kick y YouTube.',
			'Leer mensajes y eventos en tiempo real para generar respuestas, voz o acciones de moderación.',
			'Actualizar información del canal, transmisiones y estado de servicios.',
			'Refrescar tokens vencidos cuando el flujo de autenticación lo requiera.',
			'Aplicar reglas de seguridad, filtrado y moderación.',
			'Depurar errores y mantener la estabilidad del sistema.',
		],
	},
	{
		id: 'base-tecnica-y-almacenamiento',
		title: 'Base técnica y almacenamiento',
		subsections: [
			{
				title: 'Supabase',
				body: [
					'El backend guarda configuraciones y credenciales de integración en Supabase, en las siguientes tablas:',
				],
				list: [
					'public.user_settings',
					'public.twitch_tokens',
					'public.kick_tokens',
					'public.kick_event_subscriptions',
					'public.youtube_tokens',
				],
				closing: [
					'Estas tablas cuentan con Row Level Security (RLS) habilitado y el acceso está revocado para los roles anon y authenticated. El backend opera sobre esos datos únicamente mediante la service_role.',
				],
			},
			{
				title: 'Sesión y autenticación',
				body: [
					'La autenticación se valida con Clerk, ya sea mediante sesión o API key según el flujo configurado.',
				],
			},
			{
				title: 'Datos temporales en memoria',
				body: [
					'Algunos datos se mantienen solo en memoria y no se almacenan de forma persistente, por ejemplo:',
				],
				list: [
					'Historial conversacional usado para contexto de IA, limitado a 10 entradas.',
					'Estados temporales de OAuth para YouTube.',
					'Instancias activas de servicios y monitores de ejecución.',
				],
				closing: ['Una vez finalizada la ejecución, estos datos se descartan.'],
			},
		],
	},
	{
		id: 'proveedores-y-terceros',
		title: 'Proveedores y terceros',
		body: [
			'El servicio puede enviar o recibir datos a través de proveedores externos para poder funcionar correctamente. Los principales son:',
		],
		list: [
			'Clerk, para autenticación.',
			'Supabase, para almacenamiento.',
			'Twitch, para chat, perfiles, moderación y eventos.',
			'Kick, para chat, eventos y moderación.',
			'YouTube / Google, para autenticación, chat en vivo, transmisiones y estadísticas.',
			'Google Gemini u OpenRouter, para generación de texto y clasificación.',
			'Azure Speech, Fish Audio u otros proveedores configurados para voz o STT/TTS.',
		],
		closing: [
			'Cada tercero puede tratar los datos según sus propias políticas y términos. Te recomendamos revisar sus políticas de privacidad antes de conectar tus cuentas.',
		],
	},
	{
		id: 'retencion-de-datos',
		title: 'Retención de datos',
		body: ['La retención depende del tipo de dato:'],
		list: [
			'Tokens y configuración: se conservan mientras el usuario mantenga su integración activa o hasta que se eliminen manualmente.',
			'Tokens de YouTube: al cerrar sesión, el backend intenta revocar el token y luego elimina el registro guardado.',
			'Tokens de Twitch y Kick: el cierre de sesión detiene la instancia activa, pero no elimina automáticamente los tokens almacenados.',
			'Contexto conversacional: solo se conserva en memoria durante la ejecución actual.',
			'Estados temporales de OAuth: expiran en memoria después de un tiempo limitado.',
		],
		closing: [
			'Cuando desees eliminar tus datos o desconectar una integración, puedes hacerlo desde tu cuenta o escribiéndonos al correo de contacto.',
		],
	},
	{
		id: 'seguridad',
		title: 'Seguridad',
		body: ['Se aplican medidas razonables para proteger los datos, incluyendo:'],
		list: [
			'Autenticación obligatoria para las rutas sensibles.',
			'Acceso a Supabase mediante credenciales de servicio.',
			'Uso de RLS en las tablas de almacenamiento.',
			'Verificación de firmas o validación de flujo en integraciones soportadas.',
			'Manejo de tokens de refresco para reducir interrupciones operativas.',
		],
		closing: [
			'No obstante, ningún sistema conectado a Internet puede garantizar una seguridad absoluta.',
		],
	},
	{
		id: 'derechos-del-usuario',
		title: 'Derechos del usuario',
		body: ['Según la jurisdicción aplicable, el usuario puede solicitar:'],
		list: [
			'Acceso a sus datos.',
			'Rectificación de información incorrecta.',
			'Eliminación de datos o desconexión de integraciones.',
			'Información sobre el tratamiento de sus datos.',
		],
		closing: [
			'Para ejercer estos derechos, escríbenos a shandrewcontact@gmail.com. Atenderemos tu solicitud en el plazo establecido por la normativa aplicable.',
		],
	},
	{
		id: 'menores-de-edad',
		title: 'Menores de edad',
		body: [
			'El servicio no está dirigido a menores de edad sin supervisión y autorización de su tutor legal, cuando la ley aplicable lo requiera.',
		],
	},
	{
		id: 'cambios-en-esta-politica',
		title: 'Cambios en esta política',
		body: [
			'El responsable puede actualizar esta política cuando cambien las integraciones, la infraestructura o el tratamiento de datos. La versión vigente se publicará en esta página junto con su fecha de actualización.',
		],
	},
];

export default function PrivacyPolicyPage() {
	return (
		<LegalPage
			title='Política de Privacidad'
			badge='Privacidad'
			icon='privacy'
			effectiveDate='3 de agosto de 2026'
			lastUpdated='3 de agosto de 2026'
			description={`En ${sharedSiteName} recopilamos solo los datos necesarios para que el servicio funcione: conectarnos a tus canales de streaming, guardar tu configuración y generar respuestas con IA. Aquí explicamos qué datos tratamos, por qué lo hacemos y cómo los protegemos.`}
			contactEmail='shandrewcontact@gmail.com'
			sections={sections}
		/>
	);
}
