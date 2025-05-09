import { ConnectionCard } from "@/components/ConnectionCard";
import { Switchs } from "@/components/Switchs";
import { Separator } from "@radix-ui/react-separator";

function Home() {
  return (
    <div className="flex flex-row space-x-3 justify-center h-screen bg-background -mt-20">
      <div className="w-full pl-2 pr-8">
        <h1 className="mt-25 text-4xl pl-12 ">Conexión</h1>
        <div className="pl-10 pr-8">
          <ConnectionCard />
        </div>
        <div className="pt-4 pl-10 pr-8">
          <Separator />
          <Switchs />
        </div>
      </div>
    </div>
  );
}

export default Home;
