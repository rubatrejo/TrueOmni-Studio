import type { WeatherData } from '@/lib/weather';

import { formatDayAbbr } from './dates';

/**
 * Forma del weather que el `<SignageHeader>` consume directamente para
 * renderear las celdas del SVG. Desacopla el componente del shape interno
 * de Open-Meteo.
 */
export interface SignageHeaderWeather {
  /** Texto formateado del temp actual: "20°" o "--°" si no hay data. */
  currentTempText: string;
  currentWeatherCode: number | null;
  /** Cards futuras (skip today), ordenadas por proximidad. */
  forecast: Array<{
    dayLabel: string;
    highText: string;
    lowText: string;
    weatherCode: number | null;
  }>;
}

/**
 * Genera un placeholder con celdas vacías para cuando el API de weather falla.
 * Mínimo 1 card (la opción "None" del editor fue retirada — ahora 1/3/5).
 */
function buildFallback(forecastDays: 1 | 3 | 5): SignageHeaderWeather {
  return {
    currentTempText: '--°',
    currentWeatherCode: null,
    forecast: Array.from({ length: forecastDays }, () => ({
      dayLabel: '---',
      highText: '--°',
      lowText: '--°',
      weatherCode: null,
    })),
  };
}

/**
 * Transforma `WeatherData` (del lib del kiosk) al shape que el header signage
 * consume. Se encarga de:
 *  - skip de `forecast5[0]` (día actual)
 *  - tomar los siguientes `forecastDays` (0/3/5)
 *  - generar `dayLabel` localizado (FRI/VIE/...) usando el locale del cliente
 */
export function mapWeatherToHeader(
  data: WeatherData | null,
  locale: string,
  timezone: string,
  forecastDays: 1 | 3 | 5,
): SignageHeaderWeather {
  if (!data) {
    return buildFallback(forecastDays);
  }

  const today = new Date();
  const forecast = Array.from({ length: forecastDays }, (_, i) => {
    const offset = i + 1;
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const f = data.forecast5[offset];
    return {
      dayLabel: formatDayAbbr(date, locale, timezone),
      highText: f ? `${f.highF}°` : '--°',
      lowText: f ? `${f.lowF}°` : '--°',
      weatherCode: f?.weatherCode ?? null,
    };
  });

  return {
    currentTempText: `${data.currentTempF}°`,
    currentWeatherCode: data.weatherCode,
    forecast,
  };
}
