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
 */
export async function HomeHeader({
  heroImage = '/assets/home/header-bg.jpg',
  showLanguage = true,
}: {
  heroImage?: string;
  showLanguage?: boolean;
} = {}) {
  const config = await getConfig();
  const coords = config.client.coords;
  const weather = await fetchWeather(coords?.lat, coords?.lng);
  return (
    <header
      className="relative overflow-hidden"
      style={{ width: '1080px', height: '620px', flexShrink: 0 }}
    >
      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Linear gradient overlay — azul oscuro fijo en la parte superior
          para que logo + hora + clima se lean sobre cualquier foto.
          Fade a transparente hacia abajo para no ensuciar el hero. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,79,139,0.9) 0%, rgba(0,79,139,0.55) 30%, rgba(0,79,139,0) 70%)',
        }}
      />

      {/* TrueOmni logo @ (65, 44.4) */}
      <div className="absolute" style={{ left: '65px', top: '44.4px' }}>
        <TrueOmniLogo className="h-[70px] w-auto text-white" />
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
    </header>
  );
}
