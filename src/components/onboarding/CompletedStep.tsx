"use client";

import { Button } from "@/components/ui/button";
import { OnboardingFireworks } from "@/components/onboarding/OnboardingFireworks";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import type { StepProps } from "@/components/onboarding/onboarding.types";
import { ONBOARDING_COMPLETE_KEY, ONBOARDING_DISMISSED_KEY } from "@/lib/onboarding/keys";

export function CompletedStep(_: StepProps) {
  const { resolvedTheme, theme } = useTheme();
  const isLightTheme = (resolvedTheme ?? theme ?? 'dark') === 'light';

  const handleFinish = () => {
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
      window.localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    } catch {
      // ignore storage errors
    }

    window.location.replace('/home');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div
        className={`relative isolate overflow-hidden rounded-[2rem] shadow-[0_30px_120px_rgba(0,0,0,0.46)] ${
          isLightTheme ? 'border border-black/10 bg-white/90' : 'border border-white/10 bg-[#0b1020]'
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(96,165,250,0.18),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.14),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.04),transparent_34%)]" />
          <div className="absolute inset-x-0 top-0 h-[46%] bg-[linear-gradient(180deg,rgba(26,36,78,0.95)_0%,rgba(14,21,46,0.95)_56%,rgba(11,16,32,0.06)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,transparent_30%,transparent_70%,rgba(255,255,255,0.03)_100%)]" />
        </div>

        <OnboardingFireworks className="pointer-events-none absolute inset-0 z-20 opacity-90" />

        <div className="relative z-10">
          <div className="relative flex min-h-[210px] items-center justify-center px-6 pt-4 sm:px-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[560px]"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.1),transparent_28%),radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.14),transparent_48%)] blur-2xl" />
              <div className="absolute inset-x-[24%] top-[20%] h-[40%] rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative flex justify-center">
                <div className="absolute top-5 h-32 w-32 rounded-full border border-white/10 bg-white/5 shadow-[0_0_0_14px_rgba(255,255,255,0.03),0_0_56px_rgba(56,189,248,0.12)] backdrop-blur-md" />
                <div className="absolute top-3 right-[34%] z-20">
                  <Sparkles className="size-4 text-fuchsia-200" />
                </div>
                <Image
                  src="/onboarding/final.webp"
                  alt="Sandy preparada"
                  width={500}
                  height={290}
                  priority
                  className="relative z-10 h-auto w-full max-w-[500px] select-none object-contain drop-shadow-[0_16px_44px_rgba(56,189,248,0.14)]"
                />
              </div>
            </motion.div>
          </div>

          <div
            className={`border-t px-5 pt-7 pb-6 sm:px-8 ${
              isLightTheme ? 'border-black/10 bg-white text-zinc-900' : 'border-white/8 bg-white/[0.03] text-white'
            }`}
          >
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className='space-y-3'
              >
                <p
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-medium text-[11px] uppercase tracking-[0.22em] ${
                    isLightTheme
                      ? 'border-violet-500/20 bg-violet-500/10 text-violet-700'
                      : 'border-violet-400/20 bg-violet-400/10 text-violet-100'
                  }`}
                >
                  <Sparkles className={`size-3.5 ${isLightTheme ? 'text-violet-500' : 'text-cyan-200'}`} />
                  Sandy Studio listo
                </p>
                <h3
                  className={`font-semibold text-3xl tracking-tight sm:text-4xl ${
                    isLightTheme ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  ¡Tu VTuber ya está preparada!
                </h3>
                <p
                  className={`mx-auto max-w-xl text-balance text-sm leading-relaxed sm:text-base ${
                    isLightTheme ? 'text-zinc-600' : 'text-white/62'
                  }`}
                >
                  Conectaste todo lo importante. Desde aquí Sandy puede leer,
                  responder, hablar y moverse sin salir del onboarding.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="mt-8 flex flex-col items-center gap-3"
              >
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                    isLightTheme
                      ? 'border-violet-500/15 bg-violet-500/8 text-zinc-700'
                      : 'border-white/10 bg-white/[0.04] text-white/68'
                  }`}
                >
                  <Sparkles className={`size-4 ${isLightTheme ? 'text-violet-500' : 'text-violet-300'}`} />
                  Todo quedó guardado y puedes volver a cambiarlo después.
                </div>
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className={`h-12 rounded-full px-8 shadow-[0_16px_40px_rgba(255,255,255,0.08)] ${
                    isLightTheme
                      ? 'bg-[#101423] text-white hover:bg-[#0b1020]'
                      : 'bg-white text-slate-950 hover:bg-white/92'
                  }`}
                >
                  Ir al dashboard
                  <ChevronRight className="size-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
