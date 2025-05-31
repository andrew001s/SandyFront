import type { ProfileModel } from "@/interfaces/profileInterface";
import axios from "axios";


const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getProfileInfo(bot:boolean): Promise<ProfileModel> {
    const response = await axios.get(`${baseURL}/profile?bot=${bot}`);
    return response.data.profile;
  }
  