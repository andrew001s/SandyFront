import { backendClient } from '@/api/backendClient';
import type { ProfileModel } from '@/interfaces/profileInterface';

export async function getProfileInfo(bot: boolean): Promise<ProfileModel> {
	const response = await backendClient.get('/profile', {
		params: {
			bot,
		},
	});
	return response.data.profile;
}
