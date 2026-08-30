'use client';
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

interface Message {
	type: 'chat' | 'transcription' | 'reaction' | 'system';
	content: string;
	timestamp: string;
}

interface MessagesContextType {
	messages: Message[];
	addMessage: (message: Message) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);
const MAX_MESSAGES = 200;

export function MessagesProvider({ children }: { children: ReactNode }) {
	const [messages, setMessages] = useState<Message[]>([]);

	// Estables a propósito. Sin esto, `addMessage` y el valor del contexto eran
	// nuevos en cada render, y quien los tuviera en las dependencias de un efecto
	// lo re-ejecutaba con cada mensaje: el relay de IA cerraba y reabría su
	// conexión SSE cada vez que la VTuber decía algo.
	const addMessage = useCallback((message: Message) => {
		setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
	}, []);

	const value = useMemo(() => ({ messages, addMessage }), [messages, addMessage]);

	return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
	const context = useContext(MessagesContext);
	if (context === undefined) {
		throw new Error('useMessages must be used within a MessagesProvider');
	}
	return context;
}
