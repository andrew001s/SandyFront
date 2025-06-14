'use client';
import { type ReactNode, createContext, useContext, useState } from 'react';

interface Message {
	type: 'chat' | 'transcription';
	content: string;
	timestamp: string;
}

interface MessagesContextType {
	messages: Message[];
	addMessage: (message: Message) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
	const [messages, setMessages] = useState<Message[]>([]);

	const addMessage = (message: Message) => {
		setMessages((prev) => [...prev, message]);
	};

	return (
		<MessagesContext.Provider value={{ messages, addMessage }}>{children}</MessagesContext.Provider>
	);
}

export function useMessages() {
	const context = useContext(MessagesContext);
	if (context === undefined) {
		throw new Error('useMessages must be used within a MessagesProvider');
	}
	return context;
}
