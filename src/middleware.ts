import { mantainFlag } from '@/flags';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/home(.*)', '/avatar(.*)', '/onboarding(.*)']);

/**
 * Lo único que sigue en pie con el modo mantenimiento activo.
 *
 * Además del login va el endpoint del Flags Explorer: si se bloqueara, no se
 * podría apagar el flag desde el toolbar de Vercel y haría falta un despliegue
 * para salir del mantenimiento.
 */
const isMaintenanceExempt = createRouteMatcher([
	'/mantenimiento',
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/__clerk(.*)',
	'/.well-known/vercel/flags(.*)',
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
