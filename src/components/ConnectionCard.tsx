import { start } from "@/api/sandycore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast, ToastContainer } from "react-toastify";
import { useStatus } from "@/context/StatusContext";
import { useCallback, useEffect } from "react";

export const ConnectionCard = () => {
  const { status, setStatus } = useStatus();
  const handleStart = useCallback(async () => {
    try {
      await start();

      setStatus(true);
    } catch (error) {
      console.error("Error starting Sandy:", error);
      toast.error("Error starting Sandy");
      setStatus(false);
    }
  }, [setStatus]);

  useEffect(() => {
    try {
      handleStart();
      toast.success("Sandy started");
    } catch (error) {
      console.error("Error starting Sandy:", error);
      toast.error("Error starting Sandy");
    }
  }, [handleStart]);

  return (
    <Card className="w-full mt-3 bg-chart-4 p-0.5 gap-0">
      <ToastContainer />
      <div className="flex flex-row items-center justify-between p-4">
        <Avatar className="ml-4 w-28 h-28">
          <AvatarImage src="" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="mx-4 flex flex-col justify-center">
          <Button
            onClick={handleStart}
            className="mx-auto w-xs bg-chart-1 text-xl text-foreground font-normal hover:bg-chart-1 cursor-pointer h-16"
          >
            {status ? (
              <span>Desconectar</span>
            ) : (
              <span>Conectar con Twitch</span>
            )}
          </Button>
          <span className="text-xl pt-2">
            Estado:{" "}
            {status ? (
              <span className="text-chart-3">Conectado</span>
            ) : (
              <span className="text-chart-5">Desconectado</span>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
};
