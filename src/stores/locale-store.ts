'use client';

import { create } from 'zustand';

/**
 * Store del idioma activo del kiosk.
 * Persiste en `sessionStorage` para que el idioma se mantenga durante la
 * sesión del navegador y se resetee al cerrar/cambiar de cliente.
 *
 * Uso:
 *   const locale = useLocaleStore((s) => s.currentLocale);
 *   const setLocale = useLocaleStore((s) => s.setLocale);
 *
 * El store se hidrata desde sessionStorage en `initFromSession(defaultLocale)`,
 * llamado por el `I18nProvider` cliente al montar.
 */

const STORAGE_KEY = 'kiosk_active_locale';

interface LocaleState {
  currentLocale: string;
  /** True después de leer sessionStorage la primera vez. Evita flicker. */
  hydrated: boolean;
  setLocale: (locale: string) => void;
  initFromSession: (defaultLocale: string, available: readonly string[]) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  currentLocale: 'en',
  hydrated: false,
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, locale);
      } catch {
        // ignore quota / privacy errors
      }
    }
    set({ currentLocale: locale });
  },
  initFromSession: (defaultLocale, available) => {
    let next = defaultLocale;
    if (typeof window !== 'undefined') {
      try {
        const stored = window.sessionStorage.getItem(STORAGE_KEY);
        if (stored && available.includes(stored)) {
          next = stored;
        }
      } catch {
        // ignore
      }
    }
    set({ currentLocale: next, hydrated: true });
  },
}));
