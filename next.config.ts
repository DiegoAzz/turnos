import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Configuración optimizada para Coolify / Docker y producción */
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
