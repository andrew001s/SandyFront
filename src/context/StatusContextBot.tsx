import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface StatusContextProps {
  statusBot: boolean;
  setStatusBot: (value: boolean) => void;
}

const StatusContextBot = createContext<StatusContextProps | undefined>(undefined);

export const StatusProviderBot = ({ children }: { children: ReactNode }) => {
  // Leer estado inicial desde localStorage para el bot
  const [status, setStatusState] = useState(() => {
    const stored = localStorage.getItem("botStatus");
    return stored ? JSON.parse(stored) : false;
  });

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

// eslint-disable-next-line react-refresh/only-export-components
export const useStatusBot = (): StatusContextProps => {
  const context = useContext(StatusContextBot);
  if (!context) {
    throw new Error("useStatusBot must be used within a StatusProviderBot");
  }
  return context;
};
