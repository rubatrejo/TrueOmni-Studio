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
  // Rewrites: `/k/<slug>` → `/?client=<slug>` (audit F-25). URL más limpio
  // para compartir entre operadores: "Visita /k/default" en vez de
  // "/?client=default". El query param se mantiene como source of truth
  // interno (KIOSK_CLIENT lo ignora — el client lo lee del URL).
  // Cuando el dominio real exista, este rewrite seguirá funcionando y
  // además podremos añadir subdominios via wildcard en Vercel.
  async rewrites() {
    return [
      {
        source: '/k/:slug',
        destination: '/?client=:slug',
      },
    ];
  },
  // Dev indicator: oculto por completo (audit F-30 — quedaba en screenshots
  // que se compartían con stakeholders). Cuando el kiosk se embebe en el
  // Studio, `<StudioBridge>` además inyecta CSS para ocultar cualquier portal
  // Next residual. Para verlo localmente, comenta este bloque.
  devIndicators: false,
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
