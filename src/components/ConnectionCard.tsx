import { start, stop } from "@/api/sandycore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { useStatus } from "@/context/StatusContext";
import { useCallback, useEffect, useState } from "react";
import { getProfileInfo } from "@/api/fetchProfile";
import { TailSpin } from "react-loader-spinner";
import type { ProfileModel } from "@/interfaces/profileInterface";
import { BsMoonStarsFill } from "react-icons/bs";

export const ConnectionCard = () => {
  const { status, setStatus } = useStatus();
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchProfile = useCallback(async () => {
    try {
      const profileInfo = await getProfileInfo(false);
      setProfile(profileInfo);
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      toast.error("No se pudo cargar el perfil");
      setStatus(false);
    }
  }, [setStatus]);

  const handleStart = useCallback(async () => {
    try {
      setIsLoading(true);
      await start(false);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await fetchProfile();
      setStatus(true);
      toast.success("Conectado a Twitch");
    } catch (error) {
      console.error("Error iniciando sesión:", error);
      toast.error("Error al conectar con Twitch");
      setStatus(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, setStatus]);

  const handleClose = useCallback(async () => {
    try {
      await stop(false);
      setStatus(false);
      setProfile(null);
      toast.info("Desconectado de Twitch");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      toast.error("Error al desconectar");
    }
  }, [setStatus]);

  useEffect(() => {
    if (status && !profile) {
      fetchProfile();
      setIsLoading(false);
    }
  }, [status, profile, fetchProfile]);

  return (
    <Card
      className="w-full mt-3 p-0.5 gap-0"
      style={{ background: "linear-gradient(90deg, #3A265E, #4B367C)" }}
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
          {status ? (
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
              disabled={isLoading}
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
