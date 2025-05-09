import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface StatusContextProps {
  status: boolean;
  setStatus: (value: boolean) => void;
}

const StatusContext = createContext<StatusContextProps | undefined>(undefined);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  // Leer estado inicial desde localStorage
  const [status, setStatusState] = useState(() => {
    const stored = localStorage.getItem("globalStatus");
    return stored ? JSON.parse(stored) : false;
  });

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
