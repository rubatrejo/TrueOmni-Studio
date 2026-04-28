'use client';

import { useEffect, useRef, useState } from 'react';

import { useAvailableLocales, useCurrentLocale } from '@/components/i18n-provider';
import { LOCALE_LABELS } from '@/lib/i18n';
import { useLocaleStore } from '@/stores/locale-store';

/**
 * Botón de idiomas 244×80 olive + dropdown que ABRE HACIA ARRIBA.
 * Idiomas vienen del config del cliente (`features.languages.available`).
 * Click en un item cambia el idioma activo (sessionStorage + re-render del provider).
 */
export function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const available = useAvailableLocales();
  const current = useCurrentLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);

  // Cierra si se toca fuera del wrapper.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentLabel = (LOCALE_LABELS[current] ?? current).toUpperCase();

  return (
    // El dropdown puede vivir dentro de un `<Link href="/home">` (Billboard
    // idle). `e.preventDefault()` en cada handler interno detiene la
    // navegación nativa del `<a>` ancestor; `stopPropagation` adicional
    // evita que onClick handlers de ancestors se disparen.
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Change language"
        aria-expanded={open}
        className="flex items-center font-sans font-bold uppercase text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        style={{
          width: '244px',
          height: '80px',
          backgroundColor: 'hsl(var(--brand-tertiary))',
          borderRadius: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '24px',
        }}
      >
        {/* Globe icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="16" cy="16" r="14" />
          <path d="M2 16h28M16 2c5 4 5 24 0 28M16 2c-5 4-5 24 0 28" />
        </svg>
        <span style={{ marginLeft: '14px', letterSpacing: '0.02em' }}>{currentLabel}</span>
        {/* Chevron up */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="20"
          viewBox="0 -12 18 14"
          fill="currentColor"
          className="ml-auto"
          aria-hidden
        >
          <path d="M17.776-3.066l-8.281-8.27a.707.707,0,0,0-1,0L.209-3.066a.721.721,0,0,0,0,1.016L2.062-.209a.707.707,0,0,0,1,0L8.993-6.136,14.919-.209a.707.707,0,0,0,1,0l1.853-1.842A.721.721,0,0,0,17.776-3.066Z" />
        </svg>
      </button>

      {open ? (
        <ul
          role="menu"
          aria-label="Available languages"
          className="absolute z-50 overflow-hidden bg-white shadow-2xl"
          style={{
            bottom: '100%',
            left: '0',
            width: '244px',
            marginBottom: '8px',
            borderRadius: '8px',
          }}
        >
          {available.map((locale, i) => {
            const label = LOCALE_LABELS[locale] ?? locale;
            const isCurrent = locale === current;
            return (
              <li key={locale} role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocale(locale);
                    setOpen(false);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex w-full items-center text-left font-sans font-bold text-gray-800 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                  style={{
                    fontSize: '22px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    height: '64px',
                    borderBottom: i < available.length - 1 ? '1px solid #e5e7eb' : 'none',
                    backgroundColor: isCurrent ? '#f3f4f6' : 'transparent',
                  }}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
