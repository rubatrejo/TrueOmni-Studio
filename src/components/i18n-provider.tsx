'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { LocaleStrings } from '@/lib/i18n';
import { resolveString } from '@/lib/i18n';
import { useLocaleStore } from '@/stores/locale-store';

/**
 * Provider del sistema multi-idioma.
 *
 * - El layout server-side pre-carga TODOS los locales disponibles del cliente
 *   y los pasa por props (`localesMap`).
 * - El provider hidrata el store desde sessionStorage al montar.
 * - El hook `useTextos()` devuelve una función `(key) => string` que aplica el
 *   fallback chain: `active → default → en → key`.
 *
 * El cambio de idioma client-side es instantáneo (no fetch). El idioma activo
 * persiste en sessionStorage hasta cerrar la pestaña / cambiar de cliente.
 */

interface I18nContextValue {
  /** Mapa de locale → strings, pre-cargado server-side. */
  localesMap: Record<string, LocaleStrings>;
  defaultLocale: string;
  available: readonly string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  localesMap: Record<string, LocaleStrings>;
  defaultLocale: string;
  available: readonly string[];
  children: ReactNode;
}

export function I18nProvider({
  localesMap,
  defaultLocale,
  available,
  children,
}: I18nProviderProps) {
  const initFromSession = useLocaleStore((s) => s.initFromSession);
  const setLocale = useLocaleStore((s) => s.setLocale);

  // Override del bundle i18n empujado por el Studio (preview en vivo). Los labels
  // del runtime (tiles, headers de módulo) salen de las keys i18n, así que un
  // rename en el editor debe llegar por aquí para reflejarse sin republicar.
  // Se inicializa desde el cache en window por si el provider monta tarde.
  const [i18nOverride, setI18nOverride] = useState<Record<string, LocaleStrings> | null>(() => {
    if (typeof window === 'undefined') return null;
    return (
      (window as Window & { __kioskI18nOverride?: Record<string, LocaleStrings> })
        .__kioskI18nOverride ?? null
    );
  });

  // Hidratación: leer sessionStorage al montar.
  useEffect(() => {
    initFromSession(defaultLocale, available);
  }, [initFromSession, defaultLocale, available]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const bundle = (event as CustomEvent<{ bundle?: Record<string, LocaleStrings> }>).detail
        ?.bundle;
      if (bundle && typeof bundle === 'object') setI18nOverride(bundle);
    };
    window.addEventListener('kiosk:i18n-override', handler as EventListener);
    return () => window.removeEventListener('kiosk:i18n-override', handler as EventListener);
  }, []);

  // Mezcla el override sobre el mapa SSR (override gana por locale + key).
  const effectiveLocalesMap = useMemo<Record<string, LocaleStrings>>(() => {
    if (!i18nOverride) return localesMap;
    const out: Record<string, LocaleStrings> = { ...localesMap };
    for (const [loc, strings] of Object.entries(i18nOverride)) {
      out[loc] = { ...(localesMap[loc] ?? {}), ...strings };
    }
    return out;
  }, [localesMap, i18nOverride]);

  // Listener para el locale picker del Studio (#10 audit). Cuando el operador
  // cambia el dropdown EN/ES/FR/DE/PT/JA en el preview panel, dispatchea
  // `kiosk:locale-update` y aquí actualizamos el store. Solo respondemos si
  // el locale pedido está disponible para este cliente.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ locale?: string }>).detail;
      const next = detail?.locale;
      if (!next || !available.includes(next)) return;
      setLocale(next);
    };
    window.addEventListener('kiosk:locale-update', handler as EventListener);
    return () => window.removeEventListener('kiosk:locale-update', handler as EventListener);
  }, [available, setLocale]);

  const value = useMemo<I18nContextValue>(
    () => ({ localesMap: effectiveLocalesMap, defaultLocale, available }),
    [effectiveLocalesMap, defaultLocale, available],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook que devuelve la función `t(key)` para resolver strings del idioma
 * activo con fallback chain.
 */
export function useTextos(): (key: string) => string {
  const ctx = useContext(I18nContext);
  const currentLocale = useLocaleStore((s) => s.currentLocale);

  if (!ctx) {
    // Sin provider montado: devolver identity (debug helper).
    return (key) => key;
  }

  const { localesMap, defaultLocale } = ctx;
  const active = localesMap[currentLocale] ?? {};
  const def = localesMap[defaultLocale] ?? {};
  const en = localesMap.en ?? {};

  return (key: string) => resolveString(key, active, def, en, { activeName: currentLocale });
}

/** Hook auxiliar para acceder al locale activo en JSX (lang attr, etc.). */
export function useCurrentLocale(): string {
  return useLocaleStore((s) => s.currentLocale);
}

/** Hook auxiliar para devolver la lista de idiomas disponibles del cliente. */
export function useAvailableLocales(): readonly string[] {
  const ctx = useContext(I18nContext);
  return ctx?.available ?? ['en'];
}

/**
 * Devuelve el label de un módulo del idioma activo, con fallback al literal del config.
 * Convención: la key i18n es `module_label_${moduleKey}` con guiones a underscores.
 */
export function useModuleLabel(moduleKey: string, fallbackLabel: string): string {
  const t = useTextos();
  const i18nKey = `module_label_${moduleKey.replace(/-/g, '_')}`;
  const resolved = t(i18nKey);
  return resolved === i18nKey ? fallbackLabel : resolved;
}

/**
 * Normaliza un texto a slug para usar como sufijo de key i18n.
 * "Fine Dining" → "fine_dining"; "B&B" → "b_b".
 */
function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Resuelve la traducción de una subcategoría/categoría literal del config.
 * Convención: key i18n es `subcategory_${slug(label)}`. Si no existe, fallback al literal.
 */
export function useSubcategoryLabel(label: string | undefined | null): string {
  const t = useTextos();
  if (!label) return '';
  const i18nKey = `subcategory_${slugifyLabel(label)}`;
  const resolved = t(i18nKey);
  return resolved === i18nKey ? label : resolved;
}

/**
 * Devuelve el `Record<string, string>` completo del idioma activo con fallback
 * chain aplicado por key. Útil para sustituir `config.textos` en componentes
 * client que ya iteran sobre el record (`textos.X`).
 */
export function useTextosMap(): Record<string, string> {
  const ctx = useContext(I18nContext);
  const currentLocale = useLocaleStore((s) => s.currentLocale);

  if (!ctx) return {};
  const { localesMap, defaultLocale } = ctx;
  const active = localesMap[currentLocale] ?? {};
  const def = localesMap[defaultLocale] ?? {};
  const en = localesMap.en ?? {};
  // Merge con orden de prioridad: en (base) → default → active.
  return { ...en, ...def, ...active };
}
