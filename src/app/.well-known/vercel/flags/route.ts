import { getProviderData } from '@flags-sdk/vercel';
import { createFlagsDiscoveryEndpoint } from 'flags/next';
import * as flags from '@/flags';

/** Expone los flags al Flags Explorer del toolbar de Vercel. */
export const GET = createFlagsDiscoveryEndpoint(async () => getProviderData(flags));
