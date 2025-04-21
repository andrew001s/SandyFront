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

SandyFront es una aplicación web para conectar de manera visual con [SandyCore](https://github.com/andrew001s/SandyCore)
. Este proyecto utiliza TailwindCSS para el diseño de estilos y Axios para realizar solicitudes HTTP. Además, incluye integración con React Toastify para mostrar notificaciones.

## Características

- **React + TypeScript**: Desarrollo moderno con tipado estático.
- **Vite**: Herramienta de construcción rápida y eficiente.
- **TailwindCSS**: Framework de utilidades CSS para un diseño rápido y responsivo.
- **Axios**: Cliente HTTP para interactuar con una API.
- **React Toastify**: Notificaciones elegantes y configurables.

## Requisitos previos

Asegúrate de tener instalados los siguientes programas:

- Node.js (versión 16 o superior)
- npm o yarn

## Instalación

1. Clona este repositorio:

   ```bash
   git clone https://github.com/andrew001s/SandyFront
   cd SandyFront/SandyFront
2. Instala las dependencias:
```bash
    npm install
```
3. Configura la URL de la API en el archivo .env:
```ini
VITE_API_URL="http://<DIRECCION_DE_TU_API>"
```
## Scripts disponibles

- npm run dev: Inicia el servidor de desarrollo.
- npm run build: Construye la aplicación para producción.
- npm run preview: Previsualiza la aplicación construida.
- npm run lint: Ejecuta ESLint para analizar el código.

## Uso
Inicia el servidor de desarrollo:

Abre tu navegador en http://localhost:5173.

Usa los botones de la interfaz para interactuar con la API:

Start: Inicia el servicio de Sandy Core.
Pause/Resume: Pausa o reanuda el micrófono del reconocimiento de voz.

