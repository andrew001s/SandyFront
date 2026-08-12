import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/home(.*)', '/avatar(.*)', '/onboarding(.*)']);

export default clerkMiddleware(async (auth, req) => {
	const { isAuthenticated } = await auth();

	if (isProtectedRoute(req) && !isAuthenticated) {
		return NextResponse.redirect(new URL('/auth', req.url));
	}
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
		'/__clerk/:path*',
	],
};
