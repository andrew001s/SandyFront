import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { metadataBase, sharedDescription, sharedOpenGraphImage, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'Términos del Servicio',
	description: `Condiciones de uso de ${sharedSiteName}: cuenta, acceso, uso permitido, IA, moderación y responsabilidad.`,
	alternates: {
		canonical: '/terms-of-service',
	},
	openGraph: {
		title: `Términos del Servicio | ${sharedSiteName}`,
		description: sharedDescription,
		type: 'website',
		siteName: sharedSiteName,
		url: '/terms-of-service',
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
		title: `Términos del Servicio | ${sharedSiteName}`,
		description: sharedDescription,
	},
};

const sections: LegalSection[] = [
	{
		id: 'aceptacion',
		title: 'Aceptación',
		body: [
			`Al usar ${sharedSiteName}, el usuario acepta estos Términos del Servicio y la Política de Privacidad asociada. Si no está de acuerdo, no debe utilizar el servicio.`,
		],
	},
	{
		id: 'descripcion-del-servicio',
		title: 'Descripción del servicio',
		body: [
			`${sharedSiteName} es una plataforma de automatización y asistencia para VTubers y streamers impulsada por IA. El sistema puede:`,
		],
		list: [
			'Autenticar usuarios.',
			'Gestionar configuraciones por usuario.',
			'Conectarse a Twitch, Kick y YouTube.',
			'Leer mensajes y eventos de chat en tiempo real.',
			'Generar respuestas mediante modelos de IA.',
			'Ejecutar acciones de moderación.',
			'Enviar mensajes, actualizar transmisiones y administrar estados operativos.',
		],
		closing: ['El servicio se ofrece a través de la aplicación web y del backend que la impulsa.'],
	},
	{
		id: 'requisitos-de-uso',
		title: 'Requisitos de uso',
		body: ['Para utilizar el servicio, el usuario debe:'],
		list: [
			'Tener permisos legales para aceptar estos términos.',
			'Contar con cuentas válidas en los proveedores externos que vaya a conectar.',
			'Mantener seguras sus credenciales y tokens.',
			'Cumplir las políticas de Twitch, Kick, YouTube, Google, Clerk, Supabase y cualquier otro proveedor integrado.',
		],
	},
	{
		id: 'cuenta-acceso-y-seguridad',
		title: 'Cuenta, acceso y seguridad',
		body: ['El usuario es responsable de:'],
		list: [
			'Proteger su acceso a Clerk o al mecanismo de autenticación configurado.',
			'No compartir tokens, claves API ni credenciales con terceros no autorizados.',
			'Revisar que los datos guardados correspondan a su propia cuenta y canal.',
			'Avisar de inmediato si detecta uso no autorizado.',
		],
		closing: [
			'El operador puede restringir el acceso si detecta abuso, riesgo de seguridad o uso indebido.',
		],
	},
	{
		id: 'uso-permitido',
		title: 'Uso permitido',
		body: [
			'El usuario se compromete a usar el servicio solo para fines legales y permitidos por las plataformas integradas. En particular, no debe utilizarse para:',
		],
		list: [
			'Enviar spam, fraude o contenido malicioso.',
			'Violar derechos de terceros.',
			'Automatizar acciones prohibidas por Twitch, Kick, YouTube o Google.',
			'Procesar contenido ilegal, discriminatorio, pornográfico o que infrinja normas de la comunidad.',
			'Intentar acceder a datos de otros usuarios sin autorización.',
			'Alterar, descompilar o interferir con la operación del backend.',
		],
		closing: ['El incumplimiento de estas normas puede derivar en la suspensión de la cuenta.'],
	},
	{
		id: 'uso-de-ia-y-automatizacion',
		title: 'Uso de IA y automatización',
		body: [
			'El servicio puede enviar mensajes, fragmentos de chat, metadatos de stream y otros datos operativos a proveedores de IA para generar respuestas, clasificar contenido o apoyar tareas de moderación.',
			'El usuario acepta que:',
		],
		list: [
			'Las respuestas generadas por IA pueden contener errores.',
			'La automatización puede ejecutar acciones sobre chat, mensajes o estados de transmisión según la configuración activa.',
			'El usuario debe revisar y ajustar las reglas de moderación, prompts y flags según su caso de uso.',
		],
	},
	{
		id: 'moderacion-y-contenido',
		title: 'Moderación y contenido',
		body: [
			'El sistema puede eliminar mensajes, advertir usuarios o responder automáticamente cuando detecte palabras prohibidas, enlaces o patrones no permitidos.',
			'El usuario es responsable de:',
		],
		list: [
			'Configurar correctamente sus listas de bloqueo.',
			'Verificar que las reglas de moderación se ajusten a su comunidad.',
			'Aceptar que la moderación automática puede producir falsos positivos o falsos negativos.',
		],
	},
	{
		id: 'servicios-de-terceros',
		title: 'Servicios de terceros',
		body: [
			'El servicio depende de proveedores externos. La disponibilidad, latencia, calidad y políticas de esos servicios no están bajo el control exclusivo del operador.',
			'El usuario acepta que los fallos de terceros pueden afectar:',
		],
		list: [
			'Inicio de sesión.',
			'Renovación de tokens.',
			'Acceso a chat o eventos.',
			'Generación de respuestas.',
			'Actualización de transmisiones.',
		],
	},
	{
		id: 'propiedad-y-contenido',
		title: 'Propiedad y contenido',
		body: [
			'El usuario conserva, en la medida permitida por la ley, los derechos sobre su propio contenido y sus datos. Sin embargo, concede al sistema las autorizaciones técnicas necesarias para:',
		],
		list: [
			'Procesar mensajes y eventos.',
			'Guardar configuraciones y tokens.',
			'Enviar solicitudes a los proveedores integrados.',
			'Ejecutar las funciones que el usuario active expresamente.',
		],
	},
	{
		id: 'disponibilidad-y-cambios',
		title: 'Disponibilidad y cambios',
		body: ["El servicio se ofrece 'tal como está' y 'según disponibilidad'. El operador puede:"],
		list: [
			'Modificar funciones.',
			'Cambiar proveedores.',
			'Ajustar límites, scopes o flujos de autenticación.',
			'Suspender temporalmente el servicio por mantenimiento o seguridad.',
		],
	},
	{
		id: 'suspension-y-terminacion',
		title: 'Suspensión y terminación',
		body: ['El operador puede suspender o terminar el acceso si:'],
		list: [
			'El usuario incumple estos términos.',
			'Existe abuso, fraude o riesgo de seguridad.',
			'Una plataforma externa revoca permisos o bloquea el acceso.',
			'El servicio deja de ser compatible con una integración determinada.',
		],
		closing: [
			'El usuario puede dejar de usar el servicio en cualquier momento. Algunas integraciones pueden requerir pasos adicionales para revocar tokens o desconectar cuentas.',
		],
	},
	{
		id: 'limitacion-de-responsabilidad',
		title: 'Limitación de responsabilidad',
		body: ['En la medida máxima permitida por la ley aplicable:'],
		list: [
			'El operador no garantiza que el servicio sea ininterrumpido o libre de errores.',
			'El operador no responde por decisiones automatizadas del usuario configuradas de forma inapropiada.',
			'El operador no responde por suspensiones, bloqueos o cambios de política de terceros.',
			'El operador no responde por daños indirectos, incidentales o consecuenciales derivados del uso del servicio.',
		],
	},
	{
		id: 'ley-aplicable-y-jurisdiccion',
		title: 'Ley aplicable y jurisdicción',
		body: [
			'La ley aplicable y la jurisdicción competente se determinarán según el país donde opere el proyecto y según lo dispuesto por la normativa vigente aplicable al titular del servicio.',
			'Cualquier controversia derivada del uso del servicio se resolverá ante los tribunales competentes conforme a dicha normativa.',
		],
	},
	{
		id: 'contacto',
		title: 'Contacto',
		body: [
			'Para soporte, privacidad o solicitudes legales, contáctanos en shandrewcontact@gmail.com.',
		],
	},
];

export default function TermsOfServicePage() {
	return (
		<LegalPage
			title='Términos del Servicio'
			badge='Términos'
			icon='terms'
			effectiveDate='3 de agosto de 2026'
			lastUpdated='3 de agosto de 2026'
			description={`Estas condiciones regulan el uso de ${sharedSiteName}: tu cuenta, tus responsabilidades al conectar plataformas de streaming, el uso de la IA y los límites del servicio. Al usarlo aceptas lo que se describe a continuación.`}
			contactEmail='shandrewcontact@gmail.com'
			sections={sections}
		/>
	);
}
