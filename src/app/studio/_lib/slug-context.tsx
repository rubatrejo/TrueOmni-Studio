'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Context que expone el slug del kiosk que se está editando en el Studio.
 *
 * Lo consumen componentes profundos (ImageField, previews) que necesitan
 * resolver paths relativos del config a URLs del Studio sin que cada
 * llamada los reciba como prop. Ver `asset-resolve.ts`.
 */
const StudioSlugContext = createContext<string | null>(null);

export function StudioSlugProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return <StudioSlugContext.Provider value={slug}>{children}</StudioSlugContext.Provider>;
}

/** Devuelve el slug activo, o null si el componente no está bajo el provider. */
export function useStudioSlug(): string | null {
  return useContext(StudioSlugContext);
}
