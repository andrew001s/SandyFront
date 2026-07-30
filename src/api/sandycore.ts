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
