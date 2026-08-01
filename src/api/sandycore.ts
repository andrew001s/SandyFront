import { backendClient } from '@/api/backendClient';

export async function activateMic() {
	const response = await backendClient.post('/pause');
	return response.data;
}

export async function resumeMic() {
	const response = await backendClient.post('/resume');
	return response.data;
}

export async function start(bot: boolean) {
	const response = await backendClient.get('/start', {
		params: {
			bot,
		},
	});
	return response.data;
}

export async function stop(bot: boolean) {
	const response = await backendClient.get('/stop', {
		params: {
			bot,
		},
	});
	return response.data;
}

export type ServiceStatus = {
	user_id: string;
	service_mode: 'manual' | 'hybrid';
	running: boolean;
	armed: boolean;
	monitor_active: boolean;
	last_known_live: boolean | null;
	last_activity: string | null;
	auto_start_on_live: boolean;
	auto_stop_on_offline: boolean;
	idle_timeout_minutes: number;
	status: 'active' | 'inactive';
};

export async function getServiceStatus() {
	const response = await backendClient.get('/service-status');
	return response.data.service as ServiceStatus;
}
