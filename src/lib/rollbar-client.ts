import type Rollbar from 'rollbar';

type RollbarConfig = ConstructorParameters<typeof Rollbar>[0];

const baseConfig = {
	captureUncaught: true,
	captureUnhandledRejections: true,
	environment: process.env.NODE_ENV || 'development',
	scrubFields: [
		'password',
		'token',
		'secret',
		'authorization',
		'cookie',
		'csrf_token',
		'access_token',
	],
};

export const clientRollbarConfig = {
	accessToken: process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN,
	...baseConfig,
} as RollbarConfig;
