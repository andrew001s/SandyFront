import axios from "axios";

const apiKey= process.env.NEXT_PUBLIC_FISH_AUDIO_KEY || ""
const idVoice = process.env.NEXT_PUBLIC_VOICE_ID || ""

export async function getVoiceSandy(message: string): Promise<Blob> {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    }
    const response = await axios.post('/fish-api/v1/tts', {
        text: message,
        reference_id: idVoice,
    }, {
        headers: headers,
        responseType: 'blob' 
    });
    
    if (response.status !== 200) {
        throw new Error('Error al obtener el audio');
    }

    return response.data as Blob;
}