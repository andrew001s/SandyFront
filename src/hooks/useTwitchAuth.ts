import { useState, useCallback } from "react";
import { getAccessToken, getTwitchAuthUrl } from "@/api/twitchAuth";
import { toast } from "sonner";
import { start, stop } from "@/api/sandycore";
import { postAuth } from "@/api/fetchAuth";
import { getProfileInfo } from "@/api/fetchProfile";
import type { ProfileModel } from "@/interfaces/profileInterface";
import { useStatus } from "@/context/StatusContext";
import { useStatusBot } from "@/context/StatusContextBot";

interface UseTwitchAuthReturn {
  profile: ProfileModel | null;
  status: boolean;
  isLoading: boolean;
  handleStart: (bot: boolean) => Promise<void>;
  handleClose: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useTwitchAuth = (defaultIsBot?: boolean): UseTwitchAuthReturn => {
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { status: userStatus, setStatus: setUserStatus } = useStatus();
  const { statusBot, setStatusBot } = useStatusBot();
  const [isBot] = useState(defaultIsBot ?? false);

  const status = isBot ? statusBot : userStatus;
  const setStatus = useCallback(
    (value: boolean) => {
      if (isBot) {
        setStatusBot(value);
      } else {
        setUserStatus(value);
      }
    },
    [isBot, setStatusBot, setUserStatus]
  );
  const fetchProfile = useCallback(async () => {
    try {
      const profileInfo = await getProfileInfo(isBot);
      setProfile(profileInfo);
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      toast.error("No se pudo cargar el perfil");
      setStatus(false);
    }
  }, [isBot, setProfile, setStatus]);
  const handleStart = useCallback(
    
    async (bot: boolean) => {
      if (bot !== isBot) {
        console.error("Tipo de conexión incorrecto");
        return;
      }      try {
        setIsLoading(true);
        const authUrl = getTwitchAuthUrl();

        const authWindow = window.open(authUrl, '_blank');
        
        if (!authWindow) {
          toast.error("No se pudo abrir la página de autenticación");
          setIsLoading(false);
          return;
        }

        const handleCallback = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "TWITCH_AUTH_CALLBACK") {
            try {
              const code = event.data.code;
              const tokenData = await getAccessToken(code);
              await postAuth({
                token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                bot: bot,
              });
              await start(bot);
              setStatus(true);              toast.success("Conectado a Twitch");
            } catch (error) {
              console.error("Error en la autenticación:", error);
              toast.error("Error en la autenticación de Twitch");
              setStatus(false);
            } finally {
              setIsLoading(false);
              window.removeEventListener("message", handleCallback);
            }
          } else if (event.data.type === "TWITCH_AUTH_ERROR") {
            console.error("Error de autenticación:", event.data.error);
            toast.error(`Error de autenticación: ${event.data.error}`);
            setIsLoading(false);
            setStatus(false);
          }
        };

        window.addEventListener("message", handleCallback);
      } catch (error) {
        console.error("Error iniciando sesión:", error);
        toast.error("Error al conectar con Twitch");
        setStatus(false);
      } 
    },
    [setStatus, isBot]
  );  const handleClose = useCallback(async () => {
    try {
      setIsLoading(true);
      await stop(isBot);
      setStatus(false);
      setProfile(null);
      toast.info("Desconectado de Twitch");
    } catch (error) {      console.error("Error cerrando sesión:", error);
      toast.error("Error al desconectar");
    } finally {
      setIsLoading(false);
    }
  }, [setStatus, isBot, setProfile]);
  return {
    profile,
    status,
    isLoading,
    handleStart,
    handleClose,
    fetchProfile,
  };
};
