import Rollbar from 'rollbar';

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

export const serverRollbar = new Rollbar({
	accessToken: process.env.ROLLBAR_SERVER_TOKEN,
	...baseConfig,
});
