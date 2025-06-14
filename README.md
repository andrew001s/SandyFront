# SandyFront

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/) 
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) 
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) 
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)](https://axios-http.com/) 

---

[![Twitter](https://img.shields.io/badge/Twitch-9146FF?style=flat&logo=twitch&logoColor=white)](https://www.twitch.tv/elshandrew) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=flat&logo=youtube&logoColor=white)](https://www.youtube.com/@shandrew) [![TikTok](https://img.shields.io/badge/TikTok-000000?style=flat&logo=tiktok&logoColor=white)](https://www.tiktok.com/@elshandrew)

---

SandyFront es una aplicación web moderna construida con Next.js para conectar de manera visual con [SandyCore](https://github.com/andrew001s/SandyCore). Este proyecto utiliza TailwindCSS para el diseño de estilos y Axios para realizar solicitudes HTTP. Además, incluye integración con Azure Speech Services para reconocimiento de voz y Fish Audio para síntesis de voz.

## Características

- **Next.js 15**: Framework React con renderizado del lado del servidor (SSR) y generación estática (SSG)
- **React + TypeScript**: Desarrollo moderno con tipado estático
- **TailwindCSS**: Framework de utilidades CSS para un diseño rápido y responsivo
- **Azure Speech Services**: Reconocimiento de voz avanzado
- **Fish Audio**: Síntesis de voz natural
- **WebSocket**: Comunicación en tiempo real
- **Axios**: Cliente HTTP para interactuar con APIs
- **Biome**: Herramienta de formateo y linting de código
- **Turbopack**: Compilador rápido y eficiente (en modo desarrollo)

## Requisitos previos

Asegúrate de tener instalados los siguientes programas:

- Node.js (versión 18 o superior)
- pnpm (versión 8 o superior)
- Claves de API para Azure Speech Services y Fish Audio

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/andrew001s/SandyFront
   cd SandyFront
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```

3. Crea un archivo .env y configura las siguientes variables:
   ```ini
  # URL de la API de Sandy Core
   NEXT_PUBLIC_API_URL="http://localhost:8000"

   # Configuración de Azure Speech Services
   NEXT_PUBLIC_AZURE_SPEECH_KEY="tu_clave_de_azure_speech"
   NEXT_PUBLIC_AZURE_REGION="tu_region_de_azure"
   NEXT_PUBLIC_LANGUAGE="es-ES"  # O el idioma que prefieras

   # Configuración de Fish Audio
   NEXT_PUBLIC_FISH_AUDIO_KEY="tu_clave_de_fish_audio"
   NEXT_PUBLIC_VOICE_ID="id_de_voz_fish_audio"

   # URL del WebSocket
   NEXT_PUBLIC_SOCKET_URL="ws://localhost:8000/ws"

   # Configuración de OAuth de Twitch
   NEXT_PUBLIC_TWITCH_CLIENT_ID="tu_client_id_de_twitch"
   NEXT_PUBLIC_TWITCH_CLIENT_SECRET="tu_client_secret_de_twitch"
   NEXT_PUBLIC_REDIRECT_URI="http://localhost:3000/auth/callback"
   ```

## Scripts disponibles

- `pnpm dev`: Inicia el servidor de desarrollo con Turbopack
- `pnpm build`: Construye la aplicación para producción
- `pnpm start`: Inicia el servidor de producción
- `pnpm lint`: Ejecuta Biome para analizar el código
- `pnpm format`: Formatea el código usando Biome

## Uso

1. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Abre tu navegador en http://localhost:3000

3. La interfaz proporciona:
   - Conexión con SandyCore
   - Reconocimiento de voz con Azure Speech
   - Síntesis de voz con Fish Audio
   - Chat en tiempo real
   - Control de estado del bot

## Configuración de APIs

### Azure Speech Services
1. Crea una cuenta en [Azure Portal](https://portal.azure.com)
2. Crea un recurso de Speech Services
3. Obtén la clave y región de tu recurso
4. Configúralas en el archivo .env

### Fish Audio
1. Obtén una clave de API de Fish Audio
2. Configura la clave y el ID de voz en el archivo .env



