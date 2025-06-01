import { createContext, useContext, ReactNode } from "react";
import { useTwitchAuth } from "@/hooks/useTwitchAuth";
import type { ProfileModel } from "@/interfaces/profileInterface";

interface TwitchAuthContextType {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  profile: ProfileModel | null;
  status: boolean;
  setStatus: (value: boolean) => void;
  handleStart: (bot: boolean) => Promise<void>;
  handleClose: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const TwitchAuthContext = createContext<TwitchAuthContextType | null>(null);
const TwitchAuthBotContext = createContext<TwitchAuthContextType | null>(null);

export const TwitchAuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useTwitchAuth();

  return (
    <TwitchAuthContext.Provider value={auth}>
      {children}
    </TwitchAuthContext.Provider>
  );
};

export const TwitchAuthBotProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const auth = useTwitchAuth();

  return (
    <TwitchAuthBotContext.Provider value={auth}>
      {children}
    </TwitchAuthBotContext.Provider>
  );
};

export const useTwitchAuthContext = () => {
  const context = useContext(TwitchAuthContext);
  if (!context) {
    throw new Error(
      "useTwitchAuthContext must be used within a TwitchAuthProvider"
    );
  }
  return context;
};

export const useTwitchAuthBotContext = () => {
  const context = useContext(TwitchAuthBotContext);
  if (!context) {
    throw new Error(
      "useTwitchAuthBotContext must be used within a TwitchAuthBotProvider"
    );
  }
  return context;
};
