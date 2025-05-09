import { start, stop } from "@/api/sandycore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { useStatusBot } from "@/context/StatusContextBot";
import { useCallback, useEffect, useState } from "react";
import { getProfileInfo } from "@/api/fetchProfile";
import { TailSpin } from "react-loader-spinner";
import type { ProfileModel } from "@/interfaces/profileInterface";
import { BsMoonStarsFill } from "react-icons/bs";
import { useStatus } from "@/context/StatusContext";

export const ConnectionCardBot = () => {
  const { statusBot, setStatusBot } = useStatusBot();
  const { status } = useStatus();
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchProfile = useCallback(async () => {
    try {
      const profileInfo = await getProfileInfo(true);
      setProfile(profileInfo);
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      toast.error("No se pudo cargar el perfil");
      setStatusBot(false);
    }
  }, [setStatusBot]);

  const handleStart = useCallback(async () => {
    try {
      setIsLoading(true);
      await start(true);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await fetchProfile();
      setStatusBot(true);
      toast.success("Conectado a Twitch");
    } catch (error) {
      console.error("Error iniciando sesión:", error);
      toast.error("Error al conectar con Twitch");
      setStatusBot(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, setStatusBot]);

  const handleClose = useCallback(async () => {
    try {
      await stop(true);
      setStatusBot(false);
      setProfile(null);
      toast.info("Desconectado de Twitch");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      toast.error("Error al desconectar");
    }
  }, [setStatusBot]);

  useEffect(() => {
    if (statusBot && !profile) {
      fetchProfile();
      setIsLoading(false);
    }
  }, [statusBot, profile, fetchProfile]);

  return (
    <Card
      className={`w-full mt-3 p-0.5 gap-0 bg-gradient-to-r from-[#3A265E] to-[#4B367C] ${!status ? 'opacity-50 bg-gray-700' : ''}`}
    >
      <div className="flex flex-row items-center justify-between p-4">
        <div className="flex flex-row space-x-4 items-center justify-center">
          <Avatar className="ml-4 w-28 h-28 border-2 border-foreground">
            <AvatarImage src={profile?.picProfile} />
            <AvatarFallback>
              <img
                src="\icons\default.png"
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
          {statusBot ? (
            <Button
              onClick={handleClose}
              className="mx-auto w-xs bg-chart-1 text-xl text-foreground font-normal hover:bg-chart-1 cursor-pointer h-16"
            >
              <span>Desconectar</span>
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              className="mx-auto w-xs bg-chart-1 text-xl text-foreground font-normal hover:bg-chart-1 cursor-pointer h-16"
              disabled={!status || isLoading} // Deshabilitar si status es false o está cargando
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
                <span className="">Conectar con Twitch</span>
              )}
            </Button>
          )}
          <span className="text-xl pt-2">
            Estado:{" "}
            {statusBot ? (
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
