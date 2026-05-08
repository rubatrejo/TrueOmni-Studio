import { SignageHeader } from '@/components/signage/header/SignageHeader';
import { SignageI18nProvider } from '@/components/signage/i18n/SignageI18nProvider';
import { SignagePlayer } from '@/components/signage/player/SignagePlayer';
import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type { SignageClientResolved, SignageDisplayConfig } from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';

import { SignageOrientationWrapper } from './SignageOrientationWrapper';
import { SignageSleepGate } from './SignageSleepGate';

/**
 * `<SignageRuntime>` — composición server del header signage + el player.
 *
 * DS1 + DS2: header pixel-perfect + player rotando slides.
 * DS11: respeta `client.header.position` (`top` | `bottom`). Cuando es `bottom`
 *       usamos `flex-col-reverse` para invertir el orden visual sin alterar el
 *       orden DOM (assistive tech sigue leyendo el header primero). La
 *       orientación vive en `<SignageOrientationWrapper>` (client) que reacciona
 *       en vivo al bridge `clientPatch.header.position`.
 * DS14: envuelve el árbol con `<SignageI18nProvider>` (bag traducido server-side)
 *       y un `<SignageSleepGate>` que opacita la pantalla en negro durante la
 *       ventana sleep configurada.
 */
export interface SignageRuntimeProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  weather: SignageHeaderWeather;
  i18nBag: Record<string, string>;
}

export function SignageRuntime({ client, display, weather, i18nBag }: SignageRuntimeProps) {
  const now = new Date();
  const initialClock = {
    clockText: formatSignageClock(now, client.locale, client.timezone, client.header.clockFormat),
    dateText: formatSignageDate(now, client.locale, client.timezone),
  };

  return (
    <SignageI18nProvider bag={i18nBag} locale={client.locale}>
      <SignageOrientationWrapper serverPosition={client.header.position}>
        <SignageHeader client={client} weather={weather} initialClock={initialClock} />
        <div className="flex-1 overflow-hidden">
          <SignagePlayer
            client={client}
            display={display}
            settings={display.settings}
            playlist={display.playlist}
          />
        </div>
        <SignageSleepGate
          sleepSchedule={display.settings.sleepSchedule}
          timezone={client.timezone}
        />
      </SignageOrientationWrapper>
    </SignageI18nProvider>
  );
}
