'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { STUDIO_GOOGLE_FONTS } from '@/lib/studio/schema';

/**
 * Dropdown para elegir Google Font del Studio. Carga la fuente
 * dinámicamente vía `<link>` para que el preview de la fuente en cada
 * opción y el `current` seleccionado se vean con su tipografía real.
 */
export function FontSelector({
  kind,
  value,
  onChange,
}: {
  kind: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // Carga las fuentes en el `<head>` del Studio para previsualizarlas.
  useEffect(() => {
    STUDIO_GOOGLE_FONTS.forEach(injectGoogleFont);
  }, []);

  return (
    <div ref={wrapperRef} className="relative mb-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/60"
      >
        <span className="flex flex-col">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-zinc-500">{kind}</span>
          <span
            className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100"
            style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
          >
            {value}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={`${kind} font`}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[280px] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {STUDIO_GOOGLE_FONTS.map((font) => {
            const selected = font === value;
            return (
              <li key={font} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(font);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
                    selected
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                      : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span
                    style={{ fontFamily: `"${font}", system-ui, sans-serif` }}
                    className="text-[14px]"
                  >
                    {font}
                  </span>
                  {selected && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const injectedFonts = new Set<string>();
function injectGoogleFont(family: string) {
  if (typeof document === 'undefined') return;
  if (injectedFonts.has(family)) return;
  injectedFonts.add(family);

  const id = `studio-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
