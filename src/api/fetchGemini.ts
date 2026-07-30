import { backendClient } from '@/api/backendClient';

export async function getResponseGemini(message: string) {
	const response = await backendClient.post('/gemini', {
		message,
	});
	return response.data.message;
}
  
