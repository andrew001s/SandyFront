export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		const { startVmcBridgeServer } = await import('@/lib/server/vmcBridgeServer');
		startVmcBridgeServer();
	}
}
