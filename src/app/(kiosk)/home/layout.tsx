import type { ReactNode } from 'react';

import { IdleTimeoutOverlay } from '@/components/home/idle-timeout-overlay';
import { getConfig } from '@/lib/config';

/**
 * Layout de `/home/*` — passthrough + overlay global de inactividad.
 *
 * Cada página interna wrappea su propio `KioskCanvas` + shell, porque los
 * módulos de listings tienen su propio layout. El overlay vive a nivel
 * del layout para cubrir TODAS las pantallas dentro de /home con el
 * mismo timer (no se reinstancia al cambiar de ruta interna).
 *
 * Reglas:
 *   - 1 minuto sin interacción → muestra popup con countdown 10s.
 *   - Cualquier toque/click/tecla durante el countdown → reinicia timer.
 *   - Si llega a 0 → resetea sessionStorage + locale al default + `router.push('/')`.
 *
 * El config `features.inactividad_reset_seg` (default 90s) controla el idle.
 */
export default async function HomeRouteLayout({ children }: { children: ReactNode }) {
  const config = await getConfig();
  const idleSeconds = config.features?.inactividad_reset_seg ?? 60;
  const lang = config.features?.languages;
  const defaultLocale = lang?.default ?? 'en';
  const availableLocales = lang?.available ?? ['en'];

  return (
    <>
      {children}
      <IdleTimeoutOverlay
        idleSeconds={idleSeconds}
        warningSeconds={10}
        defaultLocale={defaultLocale}
        availableLocales={availableLocales}
      />
    </>
  );
}
