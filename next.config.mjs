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
  // `getConfig()` lee `clients/<slug>/{config.json,tokens.css,i18n/*.json}` con
  // `fs.readFile` de una ruta dinámica (`process.cwd()`), que el file-tracer de
  // Next NO detecta — por eso esos archivos no se empaquetan en algunas lambdas
  // y la ruta crashea con "[kiosk] no se pudo cargar clients/<slug>/config.json"
  // (síntoma observado: `/pwa` daba 500 intermitente en producción mientras `/`
  // funcionaba, según el agrupamiento de lambdas). Forzamos su inclusión en
  // TODAS las rutas. Son JSON/CSS pequeños (los assets pesados se sirven aparte),
  // así que el bloat de cada lambda es mínimo.
  outputFileTracingIncludes: {
    '/**': ['./clients/*/config.json', './clients/*/tokens.css', './clients/*/i18n/*.json'],
  },
  // sharp (placeholder 16:9 del Studio) instala DOS variantes de libvips para
  // linux: glibc y musl. Vercel corre glibc, así que la musl (~16 MB) es peso
  // muerto que empujó la lambda `api/studio/clients` sobre el cap de 250 MB
  // (ya carga ~190 MB de assets fs de clients/* por el catch-all que los
  // sirve). Excluirla del tracing la devuelve bajo el límite. Deuda anotada:
  // el fix de fondo es servir los assets fs desde Blob/static, no en lambdas.
  outputFileTracingExcludes: {
    '*': [
      './node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@*/**',
      './node_modules/.pnpm/@img+sharp-linuxmusl-x64@*/**',
    ],
  },
  // Lint corre via `pnpm check` (CI gate separado). Dejar `next lint` dentro
  // del build production rompía deploys en Vercel por warnings cumulativos
  // de archivos no tocados en la rama actual. Los errores de TypeScript
  // sí se mantienen como gate del build (más estrictos y menos ruidosos).
  eslint: {
    ignoreDuringBuilds: true,
  },
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
