import type { ReactNode } from 'react';

/**
 * Layout del grupo kiosk. Passthrough — cada ruta wrappea su propio
 * `KioskCanvas` (p. ej. `/` con Billboard idle, `/home` con el Main Dashboard).
 *
 * La primera pantalla del kiosk es el Billboard en `/`; su "Touch to Start"
 * navega a `/home`.
 */
export default function KioskLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
