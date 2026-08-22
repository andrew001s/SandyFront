import { backendClient } from '@/api/backendClient';
import type { ProfileModel } from '@/interfaces/profileInterface';

type RequestAuthOptions = {
	token?: string | null;
};

const buildAuthHeaders = (token?: string | null) =>
	token
		? {
				Authorization: `Bearer ${token}`,
			}
		: undefined;

export async function getProfileInfo(
	bot: boolean,
	options: RequestAuthOptions = {},
): Promise<ProfileModel> {
	const response = await backendClient.get('/profile', {
		params: {
			bot,
		},
		headers: buildAuthHeaders(options.token),
	});
	return response.data.profile;
}
