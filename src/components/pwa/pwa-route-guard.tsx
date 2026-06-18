'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { isPwaToggleableModule } from '@/lib/pwa-module-visibility';

import { usePwaModuleVisibility } from './pwa-bridge-context';

/**
 * Guard de rutas de módulos de la PWA. Montado una vez en el layout `(pwa)`:
 * si la ruta actual `/pwa/<módulo>` corresponde a un módulo NO visible (override
 * de la PWA o herencia del Kiosk), redirige al dashboard. Cubre el acceso
 * directo por URL/bookmark (los tiles y el nav ya ocultan el punto de entrada).
 *
 * Funciona en producción (visibilidad horneada en `moduleVisibility`) y en el
 * preview del editor (resuelta en vivo por el bridge). Inerte para rutas que no
 * son módulos toggleables (dashboard, more, profile, login…).
 */
export function PwaRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const isModuleVisible = usePwaModuleVisibility();

  // Segmento de módulo de `/pwa/<seg>/...`.
  const seg = pathname.split('/')[2] ?? '';
  const moduleKey = isPwaToggleableModule(seg) ? seg : null;
  const blocked = moduleKey !== null && !isModuleVisible(moduleKey);

  useEffect(() => {
    if (blocked) router.replace('/pwa/dashboard');
  }, [blocked, router]);

  return null;
}
