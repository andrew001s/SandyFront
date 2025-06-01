import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { TailSpin } from "react-loader-spinner";
import { BsMoonStarsFill } from "react-icons/bs";
import { useTwitchAuth } from "@/hooks/useTwitchAuth";
import { useStatus } from "@/context/StatusContext";
import { useEffect } from "react";
import { getTokens, postAuth } from "@/api/fetchAuth";
import { start } from "@/api/sandycore";
import { toast } from "sonner";

export const ConnectionCardBot = () => {
  const { status: globalStatus } = useStatus();
  const { 
    isLoading, 
    setIsLoading,
    profile, 
    status, 
    handleStart, 
    handleClose,
    fetchProfile,
    setStatus
  } = useTwitchAuth(true);

  useEffect(() => {
    if (status && !profile) {
      fetchProfile();
    }
  }, [status, profile, fetchProfile]);


  const handleStartConnection = async () => {
    const tokens = await getTokens(true);
    console.log("Tokens obtenidos:", tokens);
    if (
      !tokens.tokens ||
      !tokens.tokens.token ||
      !tokens.tokens.refresh_token
    ) {
      handleStart(true);
    } else {
      try {
        setIsLoading(true);
        await postAuth({
          token: tokens.tokens.token,
          refresh_token: tokens.tokens.refresh_token,
          bot: true,
        });
        await start(true);
        setStatus(true);
        await fetchProfile();
        toast.success("Conectado a Twitch");
      } catch (error) {
        console.error("Error al reconectar:", error);
        toast.error(
          "Error al reconectar, iniciando nuevo proceso de autenticación"
        );
        handleStart(false);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <Card
      className={`w-full mt-3 p-0.5 gap-0 ${!globalStatus ? 'opacity-50 pointer-events-none' : ''}`}
      style={{ background: "linear-gradient(90deg, #3A265E, #4B367C)" }}
    >
      <div className="flex flex-row items-center justify-between p-4">
        <div className="flex flex-row space-x-4 items-center justify-center">
          <Avatar className="ml-4 w-28 h-28 border-2 border-foreground">
            <AvatarImage src={profile?.picProfile} />
            <AvatarFallback>
              <img
                src="/icons/default.png"
                alt="Default Icon"
                className="w-full h-full object-cover"
              />
            </AvatarFallback>
          </Avatar>
          <span className="text-2xl font-bold text-foreground">
            {profile?.username}
          </span>
        </div>

        <div className="mx-4 flex flex-col justify-center">
          {status ? (            <Button
              onClick={handleClose}
              className="mx-auto w-xs bg-chart-1 text-xl text-foreground font-normal hover:bg-chart-1 cursor-pointer h-16"
              disabled={isLoading || !globalStatus}
            >
              {isLoading ? (
                <div className="flex flex-row items-center justify-center space-x-3">
                  <span className="pl-2">Desconectando</span>
                  <TailSpin
                    height={24}
                    width={24}
                    color="#ffffff"
                    ariaLabel="loading"
                    visible={true}
                  />
                </div>
              ) : (
                <span>Desconectar</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStartConnection}
              className="mx-auto w-xs bg-chart-1 text-xl text-foreground font-normal hover:bg-chart-1 cursor-pointer h-16"
              disabled={isLoading || !globalStatus}
            >
              {isLoading ? (
                <div className="flex flex-row items-center justify-center space-x-3">
                  <span className="pl-2">Conectando</span>
                  <TailSpin
                    height={24}
                    width={24}
                    color="#ffffff"
                    ariaLabel="loading"
                    visible={true}
                  />
                </div>
              ) : (
                <span>Conectar con Twitch</span>
              )}
            </Button>
          )}
          <span className="text-xl pt-2">
            Estado:{" "}
            {status ? (
              <span className="text-chart-2">Conectado</span>
            ) : (
              <span className="text-chart-5">Desconectado</span>
            )}
          </span>
        </div>
      </div>
      <div className="relative">
        <BsMoonStarsFill
          className="absolute -right-3 -top-10 animate-pulse transform -scale-x-100 drop-shadow-[5px_0px_10px_rgba(255,255,255,0.5)]"
          size={60}
        />
        <BsMoonStarsFill
          className="absolute -right-3 -top-10 animate-pulse transform -scale-x-100"
          size={60}
        />
      </div>
    </Card>
  );
};
