'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Render seguro de un favicon de cliente. Maneja:
 *
 * - Sin favicon configurado (`favicon` undefined o vacío) → `fallback`.
 * - Favicon path/URL con archivo inexistente (404 → broken image) →
 *   `fallback` automático. Esencial para `default` que tiene
 *   `branding.favicon = 'assets/favicon.ico'` pero no entrega el archivo
 *   todavía.
 * - Cambio reactivo de src: si el operador sube otro favicon en Studio,
 *   reseteamos el estado de error y reintentamos.
 *
 * Hidratación: el `onError` puede perderse si el broken-load completa
 * antes del hydrate de React. El `useEffect` de mount chequea
 * `naturalWidth === 0` post-hidratación para capturar ese caso.
 *
 * El `slug` es necesario porque servimos paths relativos vía
 * `/api/studio/clients/<slug>/...` para no depender de KIOSK_CLIENT
 * global.
 */
export function FaviconBadge({
  favicon,
  slug,
  className,
  fallback = null,
}: {
  favicon: string | undefined;
  slug: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset error state cuando cambia el src (ej. operador sube otro favicon).
  useEffect(() => {
    setErrored(false);
  }, [favicon]);

  // Captura broken images cuyo `error` event firmó antes de la hidratación.
  // `naturalWidth === 0` con `complete === true` significa load fallido.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) {
      setErrored(true);
    }
  }, [favicon]);

  if (!favicon || errored) return <>{fallback}</>;

  const src = resolveFaviconSrc(favicon, slug);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime)
    <img
      loading="lazy"
      ref={imgRef}
      src={src}
      alt=""
      className={className}
      aria-hidden="true"
      onError={() => setErrored(true)}
    />
  );
}

function resolveFaviconSrc(favicon: string, slug: string): string {
  if (favicon.startsWith('data:') || favicon.startsWith('http')) return favicon;
  const trimmed = favicon.startsWith('/') ? favicon.slice(1) : favicon;
  return `/api/studio/clients/${slug}/${trimmed}`;
}
