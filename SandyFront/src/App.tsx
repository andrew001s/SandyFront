import { useState } from "react";
import { activateMic, resumeMic, start } from "./api/sandycore";
import { toast, ToastContainer } from "react-toastify";

function App() {
  const [isPaused, setIsPaused] = useState(false);

  const handleClick = async () => {
    if (isPaused) {
      try {
        await activateMic();
        setIsPaused(false); 
        toast.success("Microphone activated");
      } catch (error) {
        console.error("Error activating the microphone:", error);
        toast.error("Error activating the microphone");
      }
    } else {
      try {
        await resumeMic();
        setIsPaused(true); 
        toast.success("Microphone paused");
      } catch (error) {
        console.error("Error pausing the microphone:", error);
        toast.error("Error pausing the microphone");
      }
    }
  };
  

  const handleStart = async () => {
    try {
      await start();
      toast.success("Sandy started");
    }
    catch (error) {
      console.error("Error starting Sandy:", error);
      toast.error("Error starting Sandy");
    }
  };

  return (
    <div className="flex flex-row space-x-3 items-center justify-center h-screen bg-stone-950">
      <ToastContainer />
      <button
        type="button"
        className="p-2 rounded-xl border border-solid border-white text-white bg-gray-800"
        onClick={handleStart}
      >
        Start
      </button>
      <button
        type="button"
        className={`p-2 rounded-xl border border-solid text-white border-white ${
          isPaused ? "bg-green-500" : "bg-red-500"
        }`}
        onClick={handleClick}
      >
        {isPaused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}

export default App;
