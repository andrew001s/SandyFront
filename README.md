# SandyFront

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/) 
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) 
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/) 
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) 
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)](https://axios-http.com/) 

---

[![Twitter](https://img.shields.io/badge/Twitch-9146FF?style=flat&logo=twitch&logoColor=white)](https://www.twitch.tv/elshandrew)  [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=flat&logo=youtube&logoColor=white)](https://www.youtube.com/@shandrew)  
[![TikTok](https://img.shields.io/badge/TikTok-000000?style=flat&logo=tiktok&logoColor=white)](https://www.tiktok.com/@elshandrew)

---

SandyFront es una aplicación web para conectar de manera visual con [SandyCore](https://github.com/andrew001s/SandyCore). Este proyecto utiliza TailwindCSS para el diseño de estilos y Axios para realizar solicitudes HTTP. Además, incluye integración con Azure Speech Services para reconocimiento de voz y Fish Audio para síntesis de voz.

## Características

- **React + TypeScript**: Desarrollo moderno con tipado estático
- **Vite**: Herramienta de construcción rápida y eficiente
- **TailwindCSS**: Framework de utilidades CSS para un diseño rápido y responsivo
- **Azure Speech Services**: Reconocimiento de voz avanzado
- **Fish Audio**: Síntesis de voz natural
- **WebSocket**: Comunicación en tiempo real
- **Axios**: Cliente HTTP para interactuar con APIs

## Requisitos previos

Asegúrate de tener instalados los siguientes programas:

- Node.js (versión 16 o superior)
- npm o yarn
- Claves de API para Azure Speech Services y Fish Audio

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/andrew001s/SandyFront
   cd SandyFront
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo .env basado en .env.template y configura las siguientes variables:
   ```ini
   # URL de la API de Sandy Core
   VITE_API_URL="http://localhost:8000"

   # Configuración de Azure Speech Services
   VITE_AZURE_SPEECH_KEY='tu_clave_de_azure_speech'
   VITE_AZURE_REGION='tu_region_de_azure'
   VITE_LENGUAGE='es-ES'  # O el idioma que prefieras

   # Configuración de Fish Audio
   VITE_FISH_AUDIO_KEY='tu_clave_de_fish_audio'
   VITE_VOICE_ID='id_de_voz_fish_audio'

   # URL del WebSocket
   VITE_SOCKET_URL="ws://localhost:8000/ws"
   ```

## Scripts disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la aplicación construida
- `npm run lint`: Ejecuta ESLint para analizar el código

## Uso

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre tu navegador en http://localhost:5173

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

## Soporte

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio.

