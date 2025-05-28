import { getVoiceSandy } from "@/api/fetchFishAudio";
import { useWebSocket } from "@/hooks/useSocket";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import { useCallback, useState, useRef, useEffect } from "react";

interface WebSocketChatProps {
    type:string;
    client_id?:number;
    timestamp?:string;
    message?:string;
    response?:string;
}

const websocketUrl = import.meta.env.VITE_SOCKET_URL;
console.log("WebSocket URL:", websocketUrl);
const WebSocketChat = () => {
  const [currentMessage, setCurrentMessage] = useState<WebSocketChatProps | null>(null);
  const messagesHistoryRef = useRef<WebSocketChatProps[]>([]);
  const processedMessages = useRef<Set<string>>(new Set());
  const { audioRef, addToQueue } = useAudioQueue();

  const handleMessage = useCallback((data: string) => {
    const parsedData = JSON.parse(data) as WebSocketChatProps;
    setCurrentMessage(parsedData);
    messagesHistoryRef.current = [...messagesHistoryRef.current, parsedData];
  }, []);

  useWebSocket(websocketUrl, handleMessage);

  useEffect(() => {
    const processAudio = async () => {
      if (currentMessage?.type === 'twitch_response' && 
          currentMessage.response &&
          !processedMessages.current.has(currentMessage.response)) {
        try {
          console.log("Procesando audio para el mensaje:", currentMessage.response);
          processedMessages.current.add(currentMessage.response);
          
          const audioBlob = await getVoiceSandy(currentMessage.response);
          addToQueue(audioBlob);
        } catch (error) {
          processedMessages.current.delete(currentMessage.response);
          console.error("Error al procesar el audio:", error);
        }
      }
    };

    void processAudio();
  }, [currentMessage, addToQueue]);
  
  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="border p-3 rounded shadow h-64 overflow-y-auto">
        <ul>
          {messagesHistoryRef.current.map((msg, index) => (
            <li 
              key={`msg-${index}-${msg.timestamp || Date.now()}`} 
              className="mb-2 text-sm text-white"
            >
              {msg.message}
            </li>
          ))}
        </ul>
      </div>
      <audio ref={audioRef} preload="auto" style={{ display: "none" }}>
        <track kind="captions" />
      </audio>
    </div>
  );
};

export default WebSocketChat;
