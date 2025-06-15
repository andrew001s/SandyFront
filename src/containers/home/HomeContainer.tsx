import { CardConnectionBot } from '@/components/CardConnections/CardConnectionBot';
import { CardConnectionProfile } from '@/components/CardConnections/CardConnectionProfile';
import WebSocketChat from '@/components/Chat/Chat';
import Switchs from '@/components/Switchs/Switchs';
import { TerminalSandy } from '@/components/TerminalSandy/TerminalSandy';
import { Separator } from '@/components/ui/separator';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { TwitchAuthBotProvider, TwitchAuthProvider } from '@/context/TwitchAuthContext';

export const HomeContainer = () => {
	return (
		<div className='bg-background p-4'>
			<div className='container mx-auto'>
				<h1 className='mb-6 text-start font-bold text-4xl'>Conexión</h1>

				{/* Grid de dos columnas para las tarjetas */}
				<div className='mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2'>
					<div className='w-full'>
						<TwitchAuthProvider>
							<CardConnectionProfile />
						</TwitchAuthProvider>
					</div>
					<div className='w-full'>
						<StatusProviderBot>
							<TwitchAuthBotProvider>
								<CardConnectionBot />
							</TwitchAuthBotProvider>
						</StatusProviderBot>
					</div>
				</div>

				<Separator className='my-4' />

				{/* Sección inferior para switches y chat */}
				<div className='space-y-4'>
					<Switchs />
					<TerminalSandy />
					<WebSocketChat />
				</div>
			</div>
		</div>
	);
};
