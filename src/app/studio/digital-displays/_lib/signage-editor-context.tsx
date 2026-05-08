'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Context que expone el `clientSlug` y el bridge.jumpToSlide del editor
 * signage activo.
 *
 * El clientSlug lo consumen module forms y asset uploaders para resolver
 * paths relativos. El `jumpToSlide` lo consume PlaylistPanel para hacer
 * que clickear un slide salte al runtime preview en ese slide.
 */
interface SignageEditorContextValue {
  clientSlug: string;
  jumpToSlide?: (slideId: string) => void;
  navSlide?: (direction: 'prev' | 'next') => void;
  activeSlideId?: string | null;
}

const SignageEditorContext = createContext<SignageEditorContextValue | null>(null);

export function SignageEditorProvider({
  clientSlug,
  jumpToSlide,
  navSlide,
  activeSlideId,
  children,
}: {
  clientSlug: string;
  jumpToSlide?: (slideId: string) => void;
  navSlide?: (direction: 'prev' | 'next') => void;
  activeSlideId?: string | null;
  children: ReactNode;
}) {
  return (
    <SignageEditorContext.Provider
      value={{ clientSlug, jumpToSlide, navSlide, activeSlideId }}
    >
      {children}
    </SignageEditorContext.Provider>
  );
}

/** Devuelve el clientSlug activo del editor signage, o null si no está
 *  bajo el provider (e.g. componente cargado fuera de `<DisplayEditor>`). */
export function useSignageClientSlug(): string | null {
  return useContext(SignageEditorContext)?.clientSlug ?? null;
}

/** Devuelve la función jumpToSlide del bridge, o null si no está disponible. */
export function useSignageJumpToSlide(): ((slideId: string) => void) | null {
  return useContext(SignageEditorContext)?.jumpToSlide ?? null;
}

/** Devuelve el slideId actualmente visible en el iframe preview, o null. */
export function useSignageActiveSlideId(): string | null {
  return useContext(SignageEditorContext)?.activeSlideId ?? null;
}
