'use client';

import { useRouter } from 'next/navigation';

import { useAvailableLocales, useCurrentLocale } from '@/components/i18n-provider';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { LOCALE_LABELS } from '@/lib/i18n';
import { useLocaleStore } from '@/stores/locale-store';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Globo de "idioma" (neutro, chrome de la app). Tokenizado vía `currentColor`.
 */
export function GlobeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/**
 * Bottom-sheet (estilo iOS, como `PhotoSourceSheet`) para elegir idioma en la PWA.
 * Reutiliza el `locale-store` reactivo del kiosk (`setLocale`) → el cambio re-renderiza
 * todos los textos que pasan por `useTextos()` sin recargar. No duplica el store (D1).
 */
export function PwaLanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const available = useAvailableLocales();
  const current = useCurrentLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const router = useRouter();
  useEscapeToClose(open, onClose);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Language"
      className="absolute inset-0 z-40 flex items-end justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 focus:outline-none"
        tabIndex={-1}
      />
      <div className="relative w-full rounded-t-3xl bg-background pb-3 pt-2" style={OPEN_SANS}>
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-foreground/20" />
        {available.map((locale) => {
          const isCurrent = locale === current;
          return (
            <button
              key={locale}
              type="button"
              aria-current={isCurrent ? 'true' : undefined}
              onClick={() => {
                if (!isCurrent) {
                  // Textos del kiosk (useTextos) reactivos + cookie para que el
                  // server resuelva el slice PWA traducido; refresh re-renderiza.
                  setLocale(locale);
                  document.cookie = `pwa_locale=${locale};path=/;max-age=31536000;samesite=lax`;
                  router.refresh();
                }
                onClose();
              }}
              className="flex w-full items-center gap-3 border-t border-foreground/10 px-7 py-4 text-left text-foreground"
              style={{ fontSize: 16 }}
            >
              <span className={isCurrent ? 'text-[hsl(var(--pwa-primary))]' : 'text-foreground/55'}>
                <GlobeIcon size={20} />
              </span>
              <span className="flex-1">{LOCALE_LABELS[locale] ?? locale}</span>
              {isCurrent ? (
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[hsl(var(--pwa-primary))]"
                  aria-hidden
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
