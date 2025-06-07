import Chat from '@/components/Chat';
import { ConnectionCard } from '@/components/ConnectionCard';
import { ConnectionCardBot } from '@/components/ConnectionCardBot';
import { Switchs } from '@/components/Switchs';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { TwitchAuthBotProvider, TwitchAuthProvider } from '@/context/TwitchAuthContext';
import { Separator } from '@radix-ui/react-separator';

function Home() {
	return (
		<div className='bg-background p-4'>
			<h1 className='mb-6 text-start font-bold text-4xl'>Conexión</h1>

			<div className='container mx-auto'>
				{/* Grid de dos columnas para las tarjetas */}
				<div className='mb-6 grid grid-cols-2 gap-4'>
					<div className='w-full'>
						<TwitchAuthProvider>
							<ConnectionCard />
						</TwitchAuthProvider>
					</div>
					<div className='w-full'>
						<StatusProviderBot>
							<TwitchAuthBotProvider>
								<ConnectionCardBot />
							</TwitchAuthBotProvider>
						</StatusProviderBot>
					</div>
				</div>

				<Separator className='my-4' />

				{/* Sección inferior para switches y chat */}
				<div className='space-y-4'>
					<Switchs />
					<Chat />
				</div>
			</div>
		</div>
	);
}

export default Home;
