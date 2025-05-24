import axios from "axios";


const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getResponseGemini(message:string) {
    const response = await axios.post(`${baseURL}/gemini`, {
        message
    });
    return response.data.message;
  }
  