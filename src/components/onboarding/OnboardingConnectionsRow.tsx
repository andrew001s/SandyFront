"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { SiKick, SiTwitch, SiYoutube } from "react-icons/si";
import {
  KickAuthProvider,
  useKickAuthContext,
} from "@/context/KickAuthContext";
import {
  TwitchAuthProvider,
  useTwitchAuthContext,
} from "@/context/TwitchAuthContext";
import {
  YoutubeAuthProvider,
  useYoutubeAuthContext,
} from "@/context/YoutubeAuthContext";
import { Button } from "@/components/ui/button";

type ConnectionTileProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentClassName: string;
  connected: boolean;
  loading: boolean;
  connectLabel: string;
  disconnectLabel: string;
  onConnect: () => void;
  onDisconnect: () => void;
  ctaClassName?: string;
};

function ConnectionTile({
  title,
  subtitle,
  icon,
  accentClassName,
  connected,
  loading,
  connectLabel,
  disconnectLabel,
  onConnect,
  onDisconnect,
  ctaClassName,
}: ConnectionTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0"
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-1 flex-col gap-4">
          <div className="relative overflow-hidden rounded-[28px] border border-border/50 bg-background/35 p-5">
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-30 ${accentClassName}`}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/85 shadow-sm">
                  {icon}
                </div>
                <div>
                  <p className="font-medium text-lg">{title}</p>
                  <p className="text-muted-foreground text-sm">{subtitle}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium text-[11px] ${
                  connected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-border/70 bg-background/70 text-muted-foreground"
                }`}
              >
                {connected ? <CheckCircle2 className="size-3.5" /> : null}
                {connected ? "Conectado" : "Listo"}
              </span>
            </div>
            <div className="mt-5 flex h-44 items-center justify-center rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]">
              <div className="flex size-20 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                {icon}
              </div>
            </div>
            <div className="mt-auto">
              {connected ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDisconnect}
                  disabled={loading}
                  className="h-11 w-full justify-center rounded-2xl"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {disconnectLabel}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onConnect}
                  disabled={loading}
                  className={`mt-4 h-11 w-full justify-center rounded-2xl ${ctaClassName ?? ""}`}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {connectLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TwitchConnectionTile() {
  const { status, isLoading, handleStart, handleClose } =
    useTwitchAuthContext();

  return (
    <ConnectionTile
      title="Twitch"
      subtitle="Conecta tu cuenta principal"
      icon={<SiTwitch className="size-5 text-[#9146FF]" />}
      accentClassName="from-[#9146FF]/18 to-transparent"
      connected={status}
      loading={isLoading}
      connectLabel="Conectar Twitch"
      disconnectLabel="Desconectar Twitch"
      onConnect={() => void handleStart(false)}
      onDisconnect={() => void handleClose()}
    />
  );
}

function KickConnectionTile() {
  const { status, isLoading, handleConnect, handleDisconnect } =
    useKickAuthContext();

  return (
    <ConnectionTile
      title="Kick"
      subtitle="Autentica tu cuenta de Kick"
      icon={<SiKick className="size-5 text-[#53FC18]" />}
      accentClassName="from-[#53FC18]/18 to-transparent"
      connected={status}
      loading={isLoading}
      connectLabel="Conectar Kick"
      disconnectLabel="Desconectar Kick"
      onConnect={() => void handleConnect()}
      onDisconnect={() => void handleDisconnect()}
    />
  );
}

function YoutubeConnectionTile() {
  const {
    status,
    tokensAuthenticated,
    isLoading,
    handleConnect,
    handleDisconnect,
  } = useYoutubeAuthContext();
  const connected = tokensAuthenticated || status;

  return (
    <ConnectionTile
      title="YouTube"
      subtitle="Vincula tu canal de YouTube"
      icon={<SiYoutube className="size-5 text-[#FF0000]" />}
      accentClassName="from-[#FF0000]/18 to-transparent"
      connected={connected}
      loading={isLoading}
      connectLabel="Conectar YouTube"
      disconnectLabel="Desconectar YouTube"
      onConnect={() => void handleConnect()}
      onDisconnect={() => void handleDisconnect()}
      ctaClassName="bg-[#FF0000] hover:bg-[#cc0000]"
    />
  );
}

export function OnboardingConnectionsRow() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <TwitchAuthProvider disableInitialProfileLoad>
        <TwitchConnectionTile />
      </TwitchAuthProvider>
      <KickAuthProvider disableInitialStatusLoad>
        <KickConnectionTile />
      </KickAuthProvider>
      <YoutubeAuthProvider disableInitialStatusLoad>
        <div className="lg:col-span-2">
          <YoutubeConnectionTile />
        </div>
      </YoutubeAuthProvider>
    </div>
  );
}
