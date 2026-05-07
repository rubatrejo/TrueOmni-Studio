import { SignageHeader } from '@/components/signage/header/SignageHeader';
import { SignagePlayer } from '@/components/signage/player/SignagePlayer';
import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type { SignageClientResolved, SignageDisplayConfig } from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';

/**
 * `<SignageRuntime>` — composición server del header signage + el player.
 *
 * DS1 + DS2: header pixel-perfect arriba, player rotando slides debajo.
 * DS11 cablea el toggle de header position (top↔bottom). Hoy asume top.
 */
export interface SignageRuntimeProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  weather: SignageHeaderWeather;
}

export function SignageRuntime({ client, display, weather }: SignageRuntimeProps) {
  const now = new Date();
  const initialClock = {
    clockText: formatSignageClock(now, client.locale, client.timezone, client.header.clockFormat),
    dateText: formatSignageDate(now, client.locale, client.timezone),
  };

  return (
    <div className="flex h-full w-full flex-col bg-signage-surface">
      <SignageHeader client={client} weather={weather} initialClock={initialClock} />
      <div className="flex-1 overflow-hidden">
        <SignagePlayer
          client={client}
          display={display}
          settings={display.settings}
          playlist={display.playlist}
        />
      </div>
    </div>
  );
}
