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
};

export default nextConfig;
