import { createSpeechServicesPonyfill } from "web-speech-cognitive-services";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useState, useEffect } from "react";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { getVoiceSandy } from "@/api/fetchFishAudio";
import { getResponseGemini } from "@/api/fetchGemini";
import { useAudioQueue } from "@/hooks/useAudioQueue";

const SUBSCRIPTION_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const REGION = import.meta.env.VITE_AZURE_REGION;
const LANGUAGE = import.meta.env.VITE_LENGUAGE || "es-ES";

const { SpeechRecognition: AzureSpeechRecognition } = createSpeechServicesPonyfill({
  credentials: {
    region: REGION,
    subscriptionKey: SUBSCRIPTION_KEY,
  },
});
SpeechRecognition.applyPolyfill(AzureSpeechRecognition);

const Dictaphone = () => {
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const { audioRef, addToQueue } = useAudioQueue();
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition({
    commands: [
      {
        command: "*",
        callback: () => {
          resetSilenceTimer();
        },
      },
    ],
  });

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    const timer = setTimeout(async () => {
      if (transcript) {
        console.log("Transcripción guardada:", transcript);
        try {
          const response = await getResponseGemini(transcript);
          setTranscriptHistory((prev) => [...prev, transcript]);
          resetTranscript();

          const audioBlob = await getVoiceSandy(response);
          addToQueue(audioBlob);
        } catch (error) {
          console.error("Error al obtener respuesta de audio:", error);
          toast.error("Error al procesar el audio");
        }
      }
    }, 2000);
    setSilenceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
    };
  }, [silenceTimer]);

  const startListening = () =>
    SpeechRecognition.startListening({
      continuous: true,
      language: LANGUAGE,
    });

  const handleSpeechToggle = (checked: boolean) => {
    if (checked) {
      startListening();
      toast.success("Reconocimiento de voz activado");
    } else {
      SpeechRecognition.stopListening();
      resetTranscript();
      toast.error("Reconocimiento de voz desactivado");
      setTranscriptHistory([]);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <div className="flex pt-4 items-center space-x-3">
      <span>Reconocimiento de Voz:</span>
      <Switch onCheckedChange={handleSpeechToggle} />
      <p>{transcript}</p>
      <div>
        <h3>Transcripción:</h3>
        {transcriptHistory.map((text) => (
          <p key={`transcript-${text}-${Date.now()}`}>{text}</p>
        ))}
      </div>
      <audio ref={audioRef} preload="auto" style={{ display: "none" }}>
        <track kind="captions" />
      </audio>
    </div>
  );
};

export default Dictaphone;
