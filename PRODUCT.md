# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Streamers y VTubers hispanohablantes de Twitch, Kick y YouTube. Configuran el bot antes del directo (modelo de IA, voz, avatar, conexiones) y, durante la transmisión, vigilan el panel en una segunda pantalla: estado de los servicios, micrófono, chat y respuestas del bot. En directo miran de reojo, así que el estado tiene que leerse de un vistazo.

## Product Purpose

Sandy Studio es el panel visual de SandyCore: convierte un avatar 2D o 3D en un VTuber con IA que lee el chat, responde con voz natural, mueve la boca con lip sync en tiempo real y ayuda a moderar. El éxito es que el streamer arranque el bot en pocos clics, sin programar, y pueda confiar en él mientras transmite.

## Positioning

Un solo panel en español que une chat de Twitch/Kick/YouTube, modelo de IA elegido por el usuario (Gemini, OpenRouter o local con Ollama/vLLM), voz (Fish Audio, Edge TTS, local) y avatar (VTube Studio por API, VSeeFace por VMC/OSC), con configuración visual en vez de archivos.

## Operating Context

- Segunda pantalla junto a OBS durante el directo, tema oscuro habitual en esa escena, pero el usuario puede alternar a claro.
- Flujo: onboarding guiado → conexiones de plataforma (OAuth) → configuración de IA, voz y reconocimiento de voz (Azure Speech) → arrancar servicios desde el dashboard → vigilar chat y estado.
- Herramientas externas que el usuario tiene abiertas: VTube Studio o VSeeFace, OBS, el chat de la plataforma.

## Capabilities and Constraints

- Rutas: landing pública (`/`, `/vtuber-ia`, `/vtuber-kick`, `/chat-bot-twitch-ia`), dashboard (`/home`), conexiones, recompensas, moderación, avatar (VTube Studio / VSeeFace), configuración, cuenta (Clerk), onboarding, legales.
- Stack: Next.js 15 (App Router), React 19, Tailwind CSS v4, componentes estilo shadcn/Radix, Clerk, next-themes, framer-motion/motion, sonner.
- Tiempo real por SSE/WebSocket hacia SandyCore; muchos estados asíncronos (conectando, activo, error, sin configurar).
- Idioma de la interfaz: español.
- Tema claro y oscuro, ambos deben funcionar.

## Brand Commitments

- Nombre: Sandy Studio. Logo existente (estrella facetada con botón de play, degradado rosa-violeta-azul) en `public/icons/` (`icon.png`, `sandyDark.png`, `sandyLight.png`, `logo-nav-*.png`). Se conserva.
- Motivo estelar (estrellas, cielo nocturno, luna) se conserva como parte de la identidad en la nueva dirección visual.
- Tono cercano, en español, de creador para creadores.

## Evidence on Hand

- Vídeo y póster del hero: `public/hero.mp4`, `public/hero.webm`, `public/hero-poster.jpg`.
- Imagen de onboarding: `public/onboarding/final.webp`.
- Redes reales del creador: YouTube @Shandrew, Twitch elshandrew, X @ElShandrew, Discord, Ko-fi.
- No hay testimonios, métricas de uso ni logos de clientes verificados: no se deben inventar.

## Product Principles

1. El estado en vivo manda: si algo está caído o desconectado, se ve antes que cualquier otra cosa.
2. Configurar sin programar: cada ajuste técnico tiene una explicación corta y un valor por defecto sensato.
3. Una sola fuente de verdad visual: la misma pieza (tarjeta de servicio, campo, estado) se ve igual en todas las pantallas.
4. Honestidad: nada de cifras, testimonios o capacidades que el producto no tenga.

## Accessibility & Inclusion

WCAG AA de contraste en ambos temas, navegación por teclado completa y respeto a `prefers-reduced-motion` (ya presente en `globals.css`).
