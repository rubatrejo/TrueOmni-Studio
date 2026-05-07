import { SignageHeader } from '@/components/signage/header/SignageHeader';
import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type { SignageClientResolved, SignageDisplayConfig } from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';

/**
 * Estado intermedio entre DS1 y DS3+. Renderea el header real (DS1) sobre un
 * body blanco vacío. El body se rellena cuando arranque DS3 con el primer
 * template (`01-full-events`). DS2 introduce el `<SignagePlayer>` que rotará
 * los templates conforme se vayan construyendo.
 */
export interface SignagePlaceholderProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  weather: SignageHeaderWeather;
}

export function SignagePlaceholder({ client, weather }: SignagePlaceholderProps) {
  const now = new Date();
  const initialClock = {
    clockText: formatSignageClock(now, client.locale, client.timezone, client.header.clockFormat),
    dateText: formatSignageDate(now, client.locale, client.timezone),
  };

  return (
    <div className="flex h-full w-full flex-col bg-signage-surface">
      <SignageHeader client={client} weather={weather} initialClock={initialClock} />
      {/* Body vacío: los 8 templates aterrizan aquí en DS3..DS10. */}
      <div className="flex-1" aria-hidden="true" />
    </div>
  );
}
