'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Context que expone el `clientSlug` del signage que se está editando.
 *
 * Necesario para que componentes profundos (module forms, asset uploaders)
 * puedan resolver paths relativos a `/signage-assets/<slug>/...` y mandar
 * uploads al endpoint Blob con `?product=signage&slug=<slug>` sin que cada
 * llamada los reciba como prop. Es el equivalente de `useStudioSlug` del
 * kiosk pero scoped al producto signage.
 */
const SignageEditorContext = createContext<string | null>(null);

export function SignageEditorProvider({
  clientSlug,
  children,
}: {
  clientSlug: string;
  children: ReactNode;
}) {
  return (
    <SignageEditorContext.Provider value={clientSlug}>
      {children}
    </SignageEditorContext.Provider>
  );
}

/** Devuelve el clientSlug activo del editor signage, o null si no está
 *  bajo el provider (e.g. componente cargado fuera de `<DisplayEditor>`). */
export function useSignageClientSlug(): string | null {
  return useContext(SignageEditorContext);
}
