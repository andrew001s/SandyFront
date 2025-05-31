import { ConnectionCard } from "@/components/ConnectionCard";
import { ConnectionCardBot } from "@/components/ConnectionCardBot";
import { Switchs } from "@/components/Switchs";
import { Separator } from "@radix-ui/react-separator";
import { StatusProviderBot } from "@/context/StatusContextBot";
import { TwitchAuthProvider, TwitchAuthBotProvider } from "@/context/TwitchAuthContext";
import Chat from "@/components/Chat";

function Home() {
  return (
    <div className="bg-background p-4">
      <h1 className="text-4xl text-start mb-6 font-bold">Conexión</h1>

      <div className="container mx-auto">
        {/* Grid de dos columnas para las tarjetas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="w-full">
            <TwitchAuthProvider>
              <ConnectionCard />
            </TwitchAuthProvider>
          </div>
          <div className="w-full">
            <StatusProviderBot>
              <TwitchAuthBotProvider>
                <ConnectionCardBot />
              </TwitchAuthBotProvider>
            </StatusProviderBot>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Sección inferior para switches y chat */}
        <div className="space-y-4">
          <Switchs />
          <Chat />
        </div>
      </div>
    </div>
  );
}

export default Home;
