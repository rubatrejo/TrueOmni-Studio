'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Provider client-side del bag i18n signage (DS14).
 *
 * El bag es un `Record<string, string>` cargado server-side por
 * `loadSignageI18n` con fallback en cascada (slug+locale → slug+en →
 * default+locale → default+en). El provider lo expone via context y el hook
 * `useSignageT()` retorna una función `(key, fallback?) => string`.
 *
 * Si la key no existe en el bag, retorna `fallback ?? key` para que el código
 * llamante no se rompa por strings nuevos no traducidos.
 */

interface SignageI18nContextValue {
  bag: Record<string, string>;
  locale: string;
}

const SignageI18nContext = createContext<SignageI18nContextValue | null>(null);

export interface SignageI18nProviderProps {
  bag: Record<string, string>;
  locale: string;
  children: ReactNode;
}

export function SignageI18nProvider({ bag, locale, children }: SignageI18nProviderProps) {
  const value = useMemo(() => ({ bag, locale }), [bag, locale]);
  return <SignageI18nContext.Provider value={value}>{children}</SignageI18nContext.Provider>;
}

export type SignageT = (key: string, fallback?: string) => string;

export function useSignageT(): SignageT {
  const ctx = useContext(SignageI18nContext);
  return (key: string, fallback?: string) => {
    if (ctx && key in ctx.bag) return ctx.bag[key] ?? fallback ?? key;
    return fallback ?? key;
  };
}

export function useSignageLocale(): string {
  const ctx = useContext(SignageI18nContext);
  return ctx?.locale ?? 'en';
}
