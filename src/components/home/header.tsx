import type { ReactNode } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { getConfig } from '@/lib/config';
import { fetchWeather } from '@/lib/weather';

import { HeroBackgroundLayer } from './hero-background-layer';
import { LanguageDropdown } from './language-dropdown';
import { WeatherClock } from './weather-clock';

/**
 * Hero header universal — verbatim SVG Dashboard: 1080×620.
 *
 *   - Background: foto (prop `heroImage`, default header del home).
 *   - Gradient azul oscuro top→bottom para que el logo/clock/weather se lean.
 *   - Logo TrueOmni en (65, 44.4).
 *   - Clock + weather en (744, 40.5).
 *   - Button-Language en (418, 500) — solo si `showLanguage=true` (home dashboard).
 *     Los módulos de Listings ocultan el botón de lenguaje (propia toolbar abajo).
 *   - `children` opcionales: se renderizan DENTRO del área del hero (z-10
 *     sobre el gradient) empezando en `childrenTop` (default 170px, debajo
 *     del logo/clock). Usado por el módulo Map para meter carrusel + chips
 *     + toolbar dentro de los 620px del hero.
 */
export async function HomeHeader({
  heroImage = '/assets/home/header-bg.jpg',
  showLanguage = true,
  height = 620,
  children,
  childrenTop = 170,
  gradientExtra = 0,
  applyDashboardOverride = false,
}: {
  /** URL de la imagen de fondo. `null` → sin imagen, sólo gradient sobre azul. */
  heroImage?: string | null;
  showLanguage?: boolean;
  /** Altura del header en px. Default 620 (SVG Dashboard). */
  height?: number;
  /** Contenido opcional dentro del área del hero. */
  children?: ReactNode;
  /** Offset vertical desde donde arranca `children` (deja espacio al logo/clock). */
  childrenTop?: number;
  /** Extiende el gradient del header N px por debajo del box del header
   *  (sin afectar al flow del contenido que viene después). Útil para
   *  hacer el fade más largo sin mover el layout. */
  gradientExtra?: number;
  /**
   * Si `true`, aplica `branding.homeHero` y `branding.heroGradient` del
   * config encima del `heroImage` prop. Solo el Home Dashboard debería
   * pasar `true` — los demás módulos tienen su propio `heroImage` por
   * sección y NO deberían heredar el hero del Dashboard.
   */
  applyDashboardOverride?: boolean;
} = {}) {
  const config = await getConfig();
  const coords = config.client.coords;
  const weather = await fetchWeather(coords?.lat, coords?.lng);
  // Branding overrides: SOLO en el Dashboard (applyDashboardOverride=true).
  // En módulos como Listings/Events/Map/etc., usamos el `heroImage` prop
  // (que el módulo controla por sí mismo) y NO heredamos el hero global.
  const brand = applyDashboardOverride
    ? (
        config as unknown as {
          branding?: {
            homeHero?: { kind: 'image' | 'video'; src: string };
            heroGradient?: { from: string; to: string; angle: number };
          };
        }
      ).branding
    : undefined;
  const overrideHero = brand?.homeHero?.src ? brand.homeHero : null;
  const heroSrc = overrideHero?.src ?? heroImage;
  const heroKind: 'image' | 'video' = overrideHero?.kind ?? 'image';
  const grad = brand?.heroGradient;
  const gradientCss = grad
    ? `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})`
    : 'linear-gradient(180deg, hsl(var(--brand-primary) / 0.9) 0%, hsl(var(--brand-primary) / 0.55) 30%, hsl(var(--brand-primary) / 0) 70%)';
  return (
    <header
      className={`relative ${heroSrc ? 'overflow-hidden' : ''}`}
      style={{
        width: '1080px',
        height: `${height}px`,
        flexShrink: 0,
      }}
    >
      {/* Background image/video + gradient overlay — Client component
          que escucha `kiosk:hero-override` del bridge para reaccionar a
          ediciones live del Studio sin requerir un republish del config. */}
      <HeroBackgroundLayer
        initialSrc={heroSrc}
        initialKind={heroKind}
        initialGradientCss={gradientCss}
        height={height}
        gradientExtra={gradientExtra}
        listenForOverride={applyDashboardOverride}
      />

      {/* Logo del cliente @ (65, 38) — slot="default".
          Slot fijo 360×90 con object-contain alineado a la izquierda. Si el
          logo del cliente es más estrecho que 360px (logo cuadrado, monograma,
          etc.) se pega al borde izquierdo del slot en lugar de centrarse —
          mantiene la lectura "esto es la marca del lugar" en el extremo
          izquierdo del header, sin importar el aspect ratio del archivo. */}
      <div
        className="absolute flex items-center justify-start"
        style={{ left: '65px', top: '38px', width: '360px', height: '90px' }}
      >
        <TrueOmniLogo slot="default" align="left" className="h-full w-full text-white" />
      </div>

      {/* Weather + clock widget @ (744, 40.5) */}
      <div
        className="absolute"
        style={{ left: '744px', top: '40.5px', width: '300px', height: '85px' }}
      >
        <WeatherClock
          initialWeather={weather}
          locale={config.client.locale}
          timezone={config.client.timezone}
        />
      </div>

      {/* Button-Language (solo home dashboard) */}
      {showLanguage ? (
        <div className="absolute" style={{ left: '418px', top: '500px' }}>
          <LanguageDropdown />
        </div>
      ) : null}

      {/* Slot opcional para contenido dentro del hero (ej. Map). */}
      {children ? (
        <div
          className="absolute left-0 right-0 z-10"
          style={{ top: `${childrenTop}px`, bottom: 0 }}
        >
          {children}
        </div>
      ) : null}
    </header>
  );
}
