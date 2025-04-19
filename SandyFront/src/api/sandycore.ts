import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function activateMic(){
    try{
        axios.post(`${baseURL}/pause`)
        return "Microphone activated successfully!";
    }
    catch (error) {
        console.error("Error pausing the microphone:", error);
        return "Error pausing the microphone.";
    }
}

export function pauseMic(){
    try{
        axios.post(`${baseURL}/resume`)
        return "Microphone paused successfully!";
    }
    catch (error) {
        console.error("Error resuming the microphone:", error);
        return "Error resuming the microphone.";
    }
}

export function start(){
    try{
        axios.get(`${baseURL}/start`)
        return "Microphone started successfully!";
    }
    catch (error) {
        console.error("Error starting the microphone:", error);
        return "Error starting the microphone.";
    }
}