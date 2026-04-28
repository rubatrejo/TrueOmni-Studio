import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Next.js config mínima para el kiosk.
 *
 * KIOSK_CLIENT se lee desde process.env en el servidor (ver src/lib/client-env.ts).
 * No se expone como NEXT_PUBLIC_* para evitar filtrar el slug al bundle del navegador.
 *
 * outputFileTracingRoot: fija la raíz del workspace a este repo. Sin esto, Next
 * puede inferir la raíz como `~/` si encuentra un lockfile parental, y traza
 * archivos fuera del proyecto.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Mueve el dev indicator al borde inferior izquierdo (donde no estorba al
  // preview del kiosk dentro del iframe del Studio). Cuando se carga el
  // kiosk embebido, además ocultamos completamente el indicador con CSS
  // (ver `<StudioBridge />`).
  devIndicators: {
    position: 'bottom-left',
  },
  // pdfjs-dist declara `canvas` como dep opcional (native Node canvas). En
  // browser no se usa pero webpack intenta resolverlo igual y explota con
  // "Can't resolve '../build/Release/canvas.node'". Lo aliaseamos a `false`.
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
