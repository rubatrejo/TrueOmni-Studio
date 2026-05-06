'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Theme provider del Studio.
 *
 * - Default: dark (consistente con el editor `/studio/[slug]`).
 * - Persistencia en `localStorage["studio-theme"]`.
 * - Aplica la clase `dark` a un wrapper EXTERIOR para que las variantes
 *   `dark:` de Tailwind respondan en TODOS los descendientes (incluido
 *   el wrapper interno `studio-root`). Tailwind con `darkMode: 'class'`
 *   genera `.dark .dark\:* { ... }` y requiere que `.dark` sea ANCESTOR,
 *   nunca el mismo elemento.
 *
 * Hook público: `useStudioTheme()` → `{ theme, setTheme, toggle }`.
 */

type Theme = 'light' | 'dark';

const StudioThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
} | null>(null);

const STORAGE_KEY = 'studio-theme';

export function StudioThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Hidratación: leer la preferencia guardada solo en cliente.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    } catch (e) {
      console.warn('[studio-theme] localStorage read failed', e);
    }
  }, []);

  const setTheme = useMemo(
    () => (next: Theme) => {
      setThemeState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        console.warn('[studio-theme] localStorage write failed', e);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }),
    [theme, setTheme],
  );

  return (
    <StudioThemeContext.Provider value={value}>
      {/* Wrapper exterior: SOLO aplica la class `.dark` (sin estilos propios).
          Esto crea el ancestor que Tailwind necesita para activar `dark:`
          variants en el wrapper interior y todos sus descendientes. */}
      <div
        className={theme === 'dark' ? 'dark' : ''}
        data-studio-theme={theme}
        suppressHydrationWarning
      >
        {/* Wrapper interior: aplica el bg/fg base + dark: variants.
            transition-colors da un fade suave (~250ms) al cambiar de tema en
            todo el subtree (audit F-40). motion-reduce respeta usuarios con
            la preferencia activada. */}
        <div className="studio-root min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased transition-colors duration-300 ease-out motion-reduce:transition-none dark:bg-zinc-950 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </StudioThemeContext.Provider>
  );
}

export function useStudioTheme() {
  const ctx = useContext(StudioThemeContext);
  if (!ctx) throw new Error('useStudioTheme must be used inside <StudioThemeProvider>');
  return ctx;
}
