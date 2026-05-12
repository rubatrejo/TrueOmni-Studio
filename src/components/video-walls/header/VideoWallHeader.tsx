import { SignageHeader } from '@/components/signage/header/SignageHeader';
import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type {
  SignageClientResolved,
  SignageHeader as SignageHeaderConfig,
} from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { canvasDimensionsOf, HEADER_H, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallClientResolved } from '@/lib/video-walls/schema';

/**
 * <VideoWallHeader> — banda top continua que cruza las cells de row 0.
 *
 * Reusa el `<SignageHeader>` literal (landscape mode) dentro de un
 * wrapper absoluto de `cols × 1920 × 155 px`. Cuando un TV físico abre
 * la URL con `?cell=0,*`, ve la porción correspondiente de esta banda
 * (1920×155 top + 1920×925 del body de su cell). TVs en `?cell=1,*` (o
 * filas posteriores) NO ven el header — su crop empieza en y=1080
 * que está por debajo del header.
 */
export interface VideoWallHeaderProps {
  client: VideoWallClientResolved;
  weather: SignageHeaderWeather;
  grid: GridConfig;
}

export function VideoWallHeader({ client, weather, grid }: VideoWallHeaderProps) {
  const { width: canvasW } = canvasDimensionsOf(grid);

  // El `<SignageHeader>` espera un `SignageClientResolved`. Nuestro
  // `VideoWallClientResolved` tiene el mismo shape excepto por
  // `walls[]` en lugar de `displays[]` — el header no toca ese campo,
  // así que el cast es seguro.
  const signageClientCompat = {
    ...client,
    displays: [] as string[],
  } as unknown as SignageClientResolved;

  const now = new Date();
  const initialClock = {
    clockText: formatSignageClock(now, client.locale, client.timezone, client.header.clockFormat),
    dateText: formatSignageDate(now, client.locale, client.timezone),
  };

  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: canvasW, height: HEADER_H }}
    >
      <SignageHeader
        client={signageClientCompat}
        weather={weather}
        initialClock={initialClock}
        orientation="landscape"
      />
    </div>
  );
}

/** Sentinel para que callers que NO tienen `weather` resuelto puedan
 *  pintar el header con datos placeholder neutros. Usado por la VW3
 *  cuando no hay endpoint de weather configurado todavía. */
export const PLACEHOLDER_WEATHER: SignageHeaderWeather = {
  currentTempText: '--°',
  currentWeatherCode: null,
  forecast: [
    { dayLabel: 'FRI', highText: '--°', lowText: '--°', weatherCode: null },
    { dayLabel: 'SAT', highText: '--°', lowText: '--°', weatherCode: null },
    { dayLabel: 'SUN', highText: '--°', lowText: '--°', weatherCode: null },
  ],
};

/** Sentinel para callers que necesitan un `header` config válido sin
 *  cargar uno del cliente. */
export const PLACEHOLDER_HEADER_CONFIG: SignageHeaderConfig = {
  position: 'top',
  height: 100,
  layout: 'logo-left',
  weatherPlacement: 'center',
  clockPlacement: 'right',
  background: { kind: 'color', color: '#0b1f3a' },
  showLogo: true,
  showWeather: true,
  showClock: true,
  clockFormat: '12h',
  weatherUnits: 'imperial',
  forecastDays: 3,
};
