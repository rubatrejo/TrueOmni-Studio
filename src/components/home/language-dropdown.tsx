'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Botón de idiomas 244×80 olive + dropdown que ABRE HACIA ARRIBA (5 idiomas).
 * Dropdown positioned absolute relative to button wrapper, bottom anchored.
 * Se renderiza dentro del canvas (sin portal) — el transform: scale del canvas
 * sirve de containing block, el modal queda limitado al frame del kiosk.
 */

const LANGUAGES = ['English', 'Español', 'Français', 'Deutsche', 'Português'] as const;

export function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cierra si se toca fuera del wrapper (sin mousedown en el botón).
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

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Cambiar idioma"
        aria-expanded={open}
        className="flex items-center font-sans font-bold uppercase text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        style={{
          width: '244px',
          height: '80px',
          backgroundColor: '#b9bd39',
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
        <span style={{ marginLeft: '14px', letterSpacing: '0.02em' }}>ENGLISH</span>
        {/* Chevron up (apunta arriba — indica que abre hacia arriba).
            Path verbatim del SVG Billboard 1; y negativos → viewBox incluye y=-12..0 */}
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
          aria-label="Lista de idiomas"
          className="absolute z-50 overflow-hidden bg-white shadow-2xl"
          style={{
            bottom: '100%',
            left: '0',
            width: '244px',
            marginBottom: '8px',
            borderRadius: '8px',
          }}
        >
          {LANGUAGES.map((lang, i) => (
            <li key={lang} role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center text-left font-sans font-bold text-gray-800 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                style={{
                  fontSize: '22px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  height: '64px',
                  borderBottom: i < LANGUAGES.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
                aria-current={i === 0 ? 'true' : undefined}
              >
                {lang}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
