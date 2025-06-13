"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface StatusContextProps {
  statusBot: boolean;
  setStatusBot: (value: boolean) => void;
}

const StatusContextBot = createContext<StatusContextProps | undefined>(undefined);

export const StatusProviderBot = ({ children }: { children: ReactNode }) => {
  const [status, setStatusState] = useState(false);

  // Cargar el estado inicial desde localStorage solo en el cliente
  useEffect(() => {
    const stored = localStorage.getItem("botStatus");
    if (stored !== null) {
      setStatusState(JSON.parse(stored));
    }
  }, []);

  // Guardar en localStorage cuando el estado cambie
  useEffect(() => {
    localStorage.setItem("botStatus", JSON.stringify(status));
  }, [status]);

  const setStatus = (value: boolean) => {
    setStatusState(value);
  };

  return (
    <StatusContextBot.Provider value={{ statusBot: status, setStatusBot: setStatus }}>
      {children}
    </StatusContextBot.Provider>
  );
};

export const useStatusBot = (): StatusContextProps => {
  const context = useContext(StatusContextBot);
  if (!context) {
    throw new Error("useStatusBot must be used within a StatusProviderBot");
  }
  return context;
};
