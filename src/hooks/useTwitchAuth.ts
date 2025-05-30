import { useState, useCallback } from "react";
import { getAccessToken, getTwitchAuthUrl } from "@/api/twitchAuth";
import { toast } from "sonner";
import { start, stop } from "@/api/sandycore";
import {postAuth} from "@/api/fetchAuth";
import { getProfileInfo } from "@/api/fetchProfile";
import type { ProfileModel } from "@/interfaces/profileInterface";

interface UseTwitchAuthReturn {
  isLoading: boolean;
  profile: ProfileModel | null;
  status: boolean;
  handleStart: (bot: boolean) => Promise<void>;
  handleClose: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useTwitchAuth = (): UseTwitchAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [status, setStatus] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const profileInfo = await getProfileInfo(false);
      setProfile(profileInfo);
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      toast.error("No se pudo cargar el perfil");
      setStatus(false);
    }
  }, []);

  const handleStart = useCallback(async (bot:boolean) => {
    try {
      setIsLoading(true);
      const authUrl = getTwitchAuthUrl();
      
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "Autenticación Twitch",
        `width=${width},height=${height},left=${left},top=${top},popup=true,toolbar=no,location=no,status=no,menubar=no`
      );

      if (!popup) {
        toast.error("Por favor, permite las ventanas emergentes para continuar");
        setIsLoading(false);
        return;
      }

      const handleCallback = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'TWITCH_AUTH_CALLBACK') {
          try {
            const code = event.data.code;
            const tokenData = await getAccessToken(code);

            
            //await fetchProfile();
			await postAuth({
				token: tokenData.access_token,
				refresh_token: tokenData.refresh_token,
				bot: bot
			});
			await start(bot);
            setStatus(true);
            toast.success("Conectado a Twitch");
            
            popup.close();
          } catch (error) {
            console.error("Error en la autenticación:", error);
            toast.error("Error en la autenticación de Twitch");
            setStatus(false);
          } finally {
            window.removeEventListener('message', handleCallback);
          }
        } else if (event.data.type === 'TWITCH_AUTH_ERROR') {
          console.error("Error de autenticación:", event.data.error);
          toast.error(`Error de autenticación: ${event.data.error}`);
          setStatus(false);
          popup.close();
        }
      };

      window.addEventListener('message', handleCallback);
    } catch (error) {
      console.error("Error iniciando sesión:", error);
      toast.error("Error al conectar con Twitch");
      setStatus(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, []);

  return {
    isLoading,
    profile,
    status,
    handleStart,
    handleClose,
    fetchProfile,
  };
};
