import { mantainFlag } from '@/flags';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/home(.*)', '/avatar(.*)', '/onboarding(.*)']);

/**
 * Rutas exentas de la pantalla de modo mantenimiento.
 * Solo se permite el acceso a la propia página de aviso y a los flujos de autenticación.
 */
const isMaintenanceExempt = createRouteMatcher([
	'/mantenimiento',
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/__clerk(.*)',
	'/api/avatar(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
	if (!isMaintenanceExempt(req) && (await mantainFlag())) {
		// Rewrite y no redirect: la URL se conserva, así que al apagar el flag
		// basta recargar para volver a donde estabas.
		return NextResponse.rewrite(new URL('/mantenimiento', req.url));
	}

	if (isProtectedRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
		'/__clerk/:path*',
	],
};
