import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/fish-api/:path*',
        destination: 'https://api.fish.audio/:path*',
      },
    ];
  },
  // Configuración para permitir imágenes desde dominios externos si es necesario
  images: {
    domains: ['api.fish.audio'],
  }
};

export default nextConfig;
