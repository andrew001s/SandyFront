'use client';
import { useMessages } from "@/context/MessagesContext";
import { Terminal } from "../ui/terminal";

export const TerminalSandy = () => {
   const { messages } = useMessages();

  return (
    <Terminal>
      {messages.map((msg, index) => (
        <span
          key={`msg-${index}-${msg.timestamp}`}
          className="mb-2 text-sm text-white"
        >
          {msg.content}
        </span>
      ))}
    </Terminal>
  );
};
