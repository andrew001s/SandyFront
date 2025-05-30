import { useEffect, useState } from "react";

export const TwitchCallback = () => {
  const [message, setMessage] = useState("Procesando autenticación...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (error) {
        setStatus("error");
        setMessage(`Error: ${errorDescription || error}`);
        window.opener?.postMessage(
          { 
            type: "TWITCH_AUTH_ERROR", 
            error: errorDescription || error 
          },
          window.location.origin
        );
        return;
      }

      if (code) {
        if (window.opener) {
          window.opener.postMessage(
            { type: "TWITCH_AUTH_CALLBACK", code },
            window.location.origin
          );
          setStatus("success");
          setMessage("¡Autenticación exitosa! Esta ventana se cerrará automáticamente.");
          setTimeout(() => window.close(), 2000);
        } else {
          setStatus("error");
          setMessage("Error: No se pudo comunicar con la ventana principal.");
        }
      } else {
        setStatus("error");
        setMessage("Error: No se recibió código de autorización.");
      }
    };

    handleCallback();
  }, []);  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-purple-700">
      <div className="text-center p-8 rounded-lg bg-white/10 backdrop-blur-sm">
        <h1 className={`text-2xl font-bold mb-4 ${
          status === 'error' ? 'text-red-400' : 
          status === 'success' ? 'text-green-400' : 
          'text-white'
        }`}>
          {status === 'error' ? '⚠️ Error' : 
           status === 'success' ? '✅ Éxito' : 
           '⌛ Procesando'}
        </h1>
        <p className="text-white/90">{message}</p>
      </div>
    </div>
  );
};

export default TwitchCallback;
