import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function activateMic() {
  const response = await axios.post(`${baseURL}/pause`);
  return response.data;
}

export async function resumeMic() {
  const response = await axios.post(`${baseURL}/resume`);
  return response.data;
}

export async function start() {
  const response = await axios.get(`${baseURL}/start`);
  return response.data;
}
