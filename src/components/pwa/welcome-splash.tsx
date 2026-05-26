'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { resolveAssetUrl } from '@/lib/asset-url';

interface WelcomeSplashProps {
  /** Path/URL de la imagen de fondo fullscreen. */
  background: string;
  /** Etiqueta a11y del logo. */
  logoAlt: string;
  /** Ms antes de auto-avanzar a `nextHref`. */
  autoAdvanceMs: number;
  /**
   * Destino al que avanza el splash (Login). Si se omite, el splash NO
   * auto-navega y queda mostrando el logo — útil mientras la pantalla de
   * Login aún no existe (se cablea en su fase).
   */
  nextHref?: string;
  /** Ancho del logo como fracción del canvas. Default 0.6704 (251.4/375 del XD). */
  logoWidthPct?: number;
}

/**
 * Welcome (splash de arranque) de la PWA — pantalla 01.
 *
 * Render verbatim del XD (`designs/mobile-pwa/01-welcome.svg`, canvas 375×812
 * adaptado a 390×844):
 *   1. Fondo fullscreen (`object-cover`).
 *   2. Overlay scrim negro 50%.
 *   3. Logo del cliente centrado (vert. y horiz.) con fade-in.
 *
 * White-label: el fondo viene de `config.features.pwa.welcome.background`; el
 * logo de `<TrueOmniLogo slot="idle">` (mismo componente/override que el
 * billboard idle del kiosk). El status bar del XD es placeholder del SO real
 * y NO se dibuja.
 */
export function WelcomeSplash({
  background,
  logoAlt,
  autoAdvanceMs,
  nextHref,
  logoWidthPct = 0.6704,
}: WelcomeSplashProps) {
  const router = useRouter();
  const [logoIn, setLogoIn] = useState(false);

  // Fade-in del logo justo tras montar.
  useEffect(() => {
    const t = setTimeout(() => setLogoIn(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance a Login (solo si hay destino).
  useEffect(() => {
    if (!nextHref) return;
    const t = setTimeout(() => router.push(nextHref), autoAdvanceMs);
    return () => clearTimeout(t);
  }, [nextHref, autoAdvanceMs, router]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Fondo fullscreen (asset del cliente). */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(background)}")` }}
      />
      {/* Overlay scrim negro 50% (neutro, no es color de marca). */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Logo centrado con fade-in. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="transition-all duration-700 ease-out"
          style={{
            width: `${logoWidthPct * 100}%`,
            opacity: logoIn ? 1 : 0,
            transform: logoIn ? 'scale(1)' : 'scale(0.96)',
          }}
        >
          <TrueOmniLogo className="h-auto w-full text-white" title={logoAlt} slot="idle" />
        </div>
      </div>
    </div>
  );
}
