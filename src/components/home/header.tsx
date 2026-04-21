import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { getConfig } from '@/lib/config';
import { fetchWeather } from '@/lib/weather';

import { LanguageDropdown } from './language-dropdown';
import { WeatherClock } from './weather-clock';

/**
 * Header verbatim del SVG Dashboard: y=0..620, 1080×620.
 *   - Background: foto mountain landscape (pattern-18) + linear-gradient overlay.
 *   - Logo TrueOmni en (65, 44.4) [Group_7331 en Dashboard_Main_Header (65, 40.5)
 *     + transform interno (0, 3.881)].
 *   - Wheater group en (744, 40.5) [main (65,40.5) + (679,0)].
 *     · 12:00 PM baseline (738, 69). OpenSans 25px white.
 *     · Friday... baseline (738, 104). OpenSans 23px white.
 *     · Icono ic/home_weather en (954, 37.5). 50×40 aprox.
 *     · Línea separadora vertical en (862.5, 48.5), y2=25, stroke white.
 *     · 50° baseline (880, 70). OpenSans 25px white.
 *   - Button-Language en (418, 500). 244×80 rx=8 olive #b9bd39.
 *     · Globe en (434, 525), English text baseline (482, 548), chevron en (628, 547).
 */
export async function HomeHeader() {
  const config = await getConfig();
  const coords = config.client.coords;
  const weather = await fetchWeather(coords?.lat, coords?.lng);
  return (
    <header
      className="relative overflow-hidden"
      style={{ width: '1080px', height: '620px', flexShrink: 0 }}
    >
      {/* Background photo (landscape mountains) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/home/header-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Linear gradient overlay (del SVG linearGradient id="linear-gradient") */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,79,139,0.15) 0%, rgba(0,79,139,0.85) 100%)',
        }}
      />

      {/* TrueOmni logo @ (65, 44.4) */}
      <div className="absolute" style={{ left: '65px', top: '44.4px' }}>
        <TrueOmniLogo className="h-[70px] w-auto text-white" />
      </div>

      {/* Weather + clock widget @ (744, 40.5) verbatim Dashboard SVG.
          Width cubre hasta el icono (210+55 ≈ 270) + date label que se extiende más (~290).
          Alto incluye time row y date row abajo. */}
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

      {/* Button-Language @ (418, 500). 244×80 */}
      <div className="absolute" style={{ left: '418px', top: '500px' }}>
        <LanguageDropdown />
      </div>
    </header>
  );
}
