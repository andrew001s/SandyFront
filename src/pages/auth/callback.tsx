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
      }      if (code) {
        // Guardar el código en localStorage
        localStorage.setItem('twitch_auth_code', code);
        localStorage.setItem('twitch_auth_timestamp', Date.now().toString());

        // También intentar comunicar con la ventana principal si existe
        if (window.opener) {
          window.opener.postMessage(
            { type: "TWITCH_AUTH_CALLBACK", code },
            window.location.origin
          );
        }
        
        setStatus("success");
        setMessage("¡Autenticación exitosa! Ya puedes volver a la aplicación, esta información se transferirá automáticamente.");
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
        </h1>        <p className="text-white/90">{message}</p>
        {status === "success" && (
          <button 
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Cerrar Pestaña
          </button>
        )}
      </div>
    </div>
  );
};

export default TwitchCallback;
