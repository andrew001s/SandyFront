import { vercelAdapter } from '@flags-sdk/vercel';
import { flag } from 'flags/next';

/**
 * Modo mantenimiento. Con el flag activo la app entera queda detrás de una
 * página de aviso y solo se puede llegar al login.
 *
 * `defaultValue: false` es deliberado: si el adaptador no puede resolver el flag
 * —falta `FLAGS`, la red falla— la app sigue funcionando. Lo contrario dejaría a
 * todo el mundo fuera por un fallo de infraestructura.
 */
export const mantainFlag = flag<boolean>({
	key: 'mantain',
	adapter: vercelAdapter,
	description: 'mantenimiento',
	defaultValue: false,
});
