import axios from "axios";


const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Auth{
    token: string;
    refresh_token: string;
    bot: boolean;
}

export async function postAuth(message:Auth) {
    console.log("Enviando mensaje de autenticación:", message);
    const response = await axios.post(`${baseURL}/auth`, 
        message,
    );
    return response.data.message;
  }
  