'use client';

import { useEffect, useState } from 'react';

/**
 * `<img>` con fallback automático: si `src` falla a cargar, cambia a
 * `fallbackSrc`. Si el fallback también falla, oculta el `<img>` (el
 * background del slot queda visible).
 *
 * Lo usan los slots de B1/B3 que ahora respetan `billboard.modules` y
 * pueden referenciar imágenes del catálogo `MODULE_BILLBOARD_INFO`. Si
 * el cliente activo no tiene esa imagen ni en su carpeta ni en
 * `clients/default/assets/`, el route handler responde 404 → onError →
 * pintamos el fallback original del slot.
 */
export function SlotImage({
  src,
  fallbackSrc,
  className,
  alt = '',
}: {
  src: string;
  fallbackSrc: string;
  className?: string;
  alt?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [errored, setErrored] = useState(false);

  // Cuando cambia el `src` del prop (porque el usuario asignó otro módulo
  // en Studio), reseteamos al nuevo path y reintentamos.
  useEffect(() => {
    setCurrentSrc(src);
    setErrored(false);
  }, [src]);

  if (errored && currentSrc === fallbackSrc) {
    return null;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setErrored(true);
        }
      }}
    />
  );
}
