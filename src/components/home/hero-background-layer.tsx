'use client';

import { useEffect, useState } from 'react';

import {
  KIOSK_HERO_OVERRIDE_EVENT,
  getCachedHeroOverride,
  type HeroOverrideDetail,
} from '@/components/studio-bridge';
import { buildYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/studio/youtube';

interface HeroBackgroundLayerProps {
  /** URL inicial del hero del SSR (puede ser el default o un override del KV). */
  initialSrc: string | null;
  /** Tipo inicial — 'image' o 'video'. */
  initialKind: 'image' | 'video';
  /** Gradient CSS inicial generado en SSR. */
  initialGradientCss: string;
  /** Altura del header + extensión del gradient en px (usado en style). */
  height: number;
  gradientExtra: number;
  /**
   * Si `true`, escucha el evento `kiosk:hero-override` del bridge para
   * recibir cambios live del editor del Studio. Solo el Dashboard debería
   * activarlo: en módulos con su propio `heroImage` (Listings, Events,
   * etc.) es ruido visual heredar el hero del Dashboard.
   */
  listenForOverride?: boolean;
}

/**
 * Capa cliente que renderiza el background (image/video) y el gradient
 * overlay del `<HomeHeader>`. Se aísla en client component para suscribirse
 * al `kiosk:hero-override` del bridge del Studio: cuando el operador edita
 * `branding.homeHero` o `branding.heroGradient` en el editor, el bridge
 * dispara el evento y aquí se aplica reactivamente sin remontar el
 * `<HomeHeader>` (server component).
 *
 * En runtime de kiosk normal (sin Studio), el bridge nunca dispara → este
 * componente queda con los valores iniciales del SSR. Cero overhead.
 */
export function HeroBackgroundLayer({
  initialSrc,
  initialKind,
  initialGradientCss,
  height,
  gradientExtra,
  listenForOverride = false,
}: HeroBackgroundLayerProps) {
  const [src, setSrc] = useState<string | null>(initialSrc);
  const [kind, setKind] = useState<'image' | 'video'>(initialKind);
  const [gradientCss, setGradientCss] = useState(initialGradientCss);

  useEffect(() => {
    if (!listenForOverride) return;
    // Hidratar desde el cache del bridge si ya hubo dispatch antes del mount
    // (típico cuando se navega entre rutas dentro del iframe del Studio).
    const cached = getCachedHeroOverride();
    if (cached.homeHero?.src) {
      setSrc(cached.homeHero.src);
      setKind(cached.homeHero.kind);
    }
    if (cached.heroGradient) {
      setGradientCss(buildGradientCss(cached.heroGradient));
    }

    const onOverride = (event: Event) => {
      const detail = (event as CustomEvent<HeroOverrideDetail>).detail ?? {};
      if (detail.homeHero?.src) {
        setSrc(detail.homeHero.src);
        setKind(detail.homeHero.kind);
      }
      if (detail.heroGradient) {
        setGradientCss(buildGradientCss(detail.heroGradient));
      }
    };
    window.addEventListener(KIOSK_HERO_OVERRIDE_EVENT, onOverride);
    return () => window.removeEventListener(KIOSK_HERO_OVERRIDE_EVENT, onOverride);
  }, [listenForOverride]);

  // Si el src es una URL de YouTube, renderizamos un iframe embed en
  // lugar de un `<video>` HTML — el `<video>` solo reproduce archivos
  // MP4/WebM directos. Para Brand Video tipo YouTube, este branch
  // permite que el operador pegue una URL de YouTube en Branding →
  // Media → Brand Video, haga click en "▶ Use brand video" en el Hero
  // Header del Home Dashboard, y vea el video reproduciéndose en el
  // kiosk runtime.
  const isYouTube = kind === 'video' && src && isYouTubeUrl(src);
  const ytEmbedUrl = isYouTube ? buildYouTubeEmbedUrl(src!) : null;

  return (
    <>
      {src ? (
        ytEmbedUrl ? (
          <iframe
            key={src}
            src={ytEmbedUrl}
            title="Hero video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            // Scale up para cubrir el área sin franjas negras del iframe
            // (el video conserva ratio, pero el iframe es 16:9 fijo).
            style={{
              transform: 'scale(1.5)',
              transformOrigin: 'center center',
              pointerEvents: 'none',
            }}
          />
        ) : kind === 'video' ? (
          <video
            key={src}
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )
      ) : null}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 0,
          height: `${height + gradientExtra}px`,
          background: gradientCss,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

function buildGradientCss(grad: { from: string; to: string; angle: number }): string {
  return `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})`;
}
