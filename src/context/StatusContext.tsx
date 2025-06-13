"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface StatusContextProps {
  status: boolean;
  setStatus: (value: boolean) => void;
}

const StatusContext = createContext<StatusContextProps | undefined>(undefined);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatusState] = useState(false);

  // Cargar el estado inicial desde localStorage solo en el cliente
  useEffect(() => {
    const stored = localStorage.getItem("globalStatus");
    if (stored !== null) {
      setStatusState(JSON.parse(stored));
    }
  }, []);

  // Guardar en localStorage cuando el estado cambie
  useEffect(() => {
    localStorage.setItem("globalStatus", JSON.stringify(status));
  }, [status]);

  const setStatus = (value: boolean) => {
    setStatusState(value);
  };

  return (
    <StatusContext.Provider value={{ status, setStatus }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = (): StatusContextProps => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
};
