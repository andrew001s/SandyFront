import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/fish-api': {
        target: 'https://api.fish.audio',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fish-api/, ''),
        secure: false
      }
    }
  }
})
