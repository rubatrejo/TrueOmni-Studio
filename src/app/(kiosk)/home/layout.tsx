import type { ReactNode } from 'react';

/**
 * Layout de `/home/*` — passthrough. Cada página wrappea su propio
 * `KioskCanvas` + shell, porque los módulos de listings tienen su propio
 * layout (hero + toolbar) distinto al Dashboard.
 */
export default function HomeRouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
