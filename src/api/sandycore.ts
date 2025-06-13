import axios from "axios";
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function activateMic() {
  const response = await axios.post(`${baseURL}/pause`);
  return response.data;
}

export async function resumeMic() {
  const response = await axios.post(`${baseURL}/resume`);
  return response.data;
}

export async function start(bot: boolean) {
  const response = await axios.get(`${baseURL}/start?bot=${bot}`);
  return response.data;
}

export async function stop(bot: boolean) {
  const response = await axios.get(`${baseURL}/stop?bot=${bot}`);
  return response.data;
}