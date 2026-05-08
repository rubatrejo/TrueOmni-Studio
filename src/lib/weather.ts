import 'server-only';

/** Respuesta pública de Open-Meteo + extracto usable por la UI. */
export interface WeatherData {
  currentTempF: number;
  condition: string;
  weatherCode: number;
  forecast5: Array<{
    dayName: string;
    weatherCode: number;
    highF: number;
    lowF: number;
  }>;
}

/** Códigos WMO → label simple. Ver https://open-meteo.com/en/docs */
export function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

/**
 * Fetch live weather desde Open-Meteo (sin API key). Cacheado 10 min via
 * Next.js `revalidate: 600`.
 */
export async function fetchWeather(lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current_weather=true` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit` +
    `&timezone=auto&forecast_days=6`;

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const data = (await res.json()) as {
    current_weather: { temperature: number; weathercode: number };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };
  const code = data.current_weather.weathercode;

  const dayName = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long' });

  return {
    currentTempF: Math.round(data.current_weather.temperature),
    condition: weatherCodeToCondition(code),
    weatherCode: code,
    forecast5: data.daily.time.map((iso, i) => ({
      dayName: dayName(iso),
      weatherCode: data.daily.weather_code[i]!,
      highF: Math.round(data.daily.temperature_2m_max[i]!),
      lowF: Math.round(data.daily.temperature_2m_min[i]!),
    })),
  };
}
