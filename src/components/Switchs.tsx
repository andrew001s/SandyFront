import { useEffect, useState } from "react";
import { Switch } from "./ui/switch";
import { activateMic, resumeMic } from "@/api/sandycore";
import { toast, ToastContainer } from "react-toastify";
import { useStatus } from "@/context/StatusContext";

export const Switchs = () => {
  const { status } = useStatus();
  const [isPaused, setIsPaused] = useState(() => {
    const saved = localStorage.getItem("micPaused");
    return saved ? saved === "true" : false;
  });

  useEffect(() => {
    const handleMicState = async () => {
      if (!status) {
        return;
      }
      if (isPaused) {
        try {
          await activateMic();
          toast.success("Microphone paused");
        } catch (error) {
          console.error("Error pausing the microphone:", error);
          toast.error("Error pausing the microphone");
        }
      } else {
        try {
          await resumeMic();
          toast.success("Microphone activated");
        } catch (error) {
          console.error("Error activating the microphone:", error);
          toast.error("Error activating the microphone");
        }
      }
    };

    handleMicState();
    localStorage.setItem("micPaused", isPaused.toString());
  }, [isPaused, status]);

  return (
    <div className="flex pt-4 items-center space-x-3">
      <ToastContainer />
      <span>Reconocimiento de Voz:</span>
      <Switch
        disabled={!status}
        checked={!isPaused}
        onCheckedChange={(checked) => setIsPaused(!checked)}
      />
    </div>
  );
};
