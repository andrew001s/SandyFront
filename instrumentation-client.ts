import posthog from 'posthog-js';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (projectToken) {
	posthog.init(projectToken, {
		api_host: host,
		defaults: '2026-01-30',
		disable_session_recording: false,
		capture_exceptions: true,
		debug: process.env.NODE_ENV === 'development',
	});
} else if (process.env.NODE_ENV === 'development') {
	console.error(
		'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is missing or un-configured, so PostHog will not initialize.',
	);
}
