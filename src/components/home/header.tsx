import type { ReactNode } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { getConfig } from '@/lib/config';
import { fetchWeather } from '@/lib/weather';

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
} = {}) {
  const config = await getConfig();
  const coords = config.client.coords;
  const weather = await fetchWeather(coords?.lat, coords?.lng);
  return (
    <header
      className={`relative ${heroImage ? 'overflow-hidden' : ''}`}
      style={{
        width: '1080px',
        height: `${height}px`,
        flexShrink: 0,
      }}
    >
      {/* Background photo (opcional) */}
      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {/* Linear gradient overlay — azul oscuro fijo en la parte superior
          para que logo + hora + clima se lean sobre cualquier foto.
          Fade a transparente hacia abajo para no ensuciar el hero. Si
          `gradientExtra > 0`, el div del gradient se alarga esa cantidad
          de px por debajo del box del header (sin empujar el layout). */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 0,
          height: `${height + gradientExtra}px`,
          background:
            'linear-gradient(180deg, rgba(0,79,139,0.9) 0%, rgba(0,79,139,0.55) 30%, rgba(0,79,139,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* TrueOmni logo @ (65, 44.4) — slot="default" (logo principal del cliente). */}
      <div className="absolute" style={{ left: '65px', top: '44.4px', height: '70px' }}>
        <TrueOmniLogo slot="default" className="h-[70px] w-auto text-white" />
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
