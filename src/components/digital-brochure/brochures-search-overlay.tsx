'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { DraggableKeyboard } from '@/components/keyboard/draggable-keyboard';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { filterBrochures } from '@/lib/brochures-filter';
import type { BrochureItem } from '@/lib/config';

/**
 * Search overlay con QWERTY. Muestra resultados de `title + description`
 * mientras el usuario escribe. Click en un resultado navega al reader.
 */
export function BrochuresSearchOverlay({
  open,
  moduleKey,
  brochures,
  onClose,
}: {
  open: boolean;
  moduleKey: string;
  brochures: readonly BrochureItem[];
  onClose: () => void;
}) {
  const [value, setValue] = useState('');

  useEscapeToClose(open, onClose);

  const matches = useMemo(() => {
    if (!value.trim()) return [];
    return filterBrochures(brochures, { query: value }).slice(0, 6);
  }, [brochures, value]);

  if (!open) return null;

  const handleKey = (k: KeyboardKey) => {
    if (k === 'BACKSPACE') setValue((v) => v.slice(0, -1));
    else if (k === 'SPACE') setValue((v) => v + ' ');
    else if (k === 'ENTER') onClose();
    else if (typeof k === 'string') setValue((v) => v + k);
  };

  return (
    <div role="dialog" aria-modal="true" className="absolute inset-0" style={{ zIndex: 50 }}>
      <button
        type="button"
        aria-label="Cerrar buscador"
        onClick={onClose}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        tabIndex={-1}
      />

      {/* Input bar */}
      <div
        className="absolute left-1/2 flex items-center"
        style={{
          top: '620px',
          transform: 'translateX(-50%)',
          width: '1000px',
          height: '84px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '0 10px 0 24px',
          columnGap: '12px',
          boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
        }}
      >
        <input
          type="text"
          value={value}
          readOnly
          placeholder="What are you looking for?"
          aria-label="Buscar brochure"
          className="flex-1 font-sans"
          style={{
            fontSize: '22px',
            color: '#222',
            border: 'none',
            outline: 'none',
            background: 'transparent',
          }}
        />
        <button
          type="button"
          onClick={onClose}
          className="font-sans"
          style={{
            width: '180px',
            height: '64px',
            borderRadius: '8px',
            backgroundColor: 'hsl(var(--brand-tertiary))',
            color: '#ffffff',
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          SEARCH
        </button>
      </div>

      {/* Results */}
      {value.trim() ? (
        <div
          className="absolute left-1/2 overflow-hidden"
          style={{
            top: '720px',
            transform: 'translateX(-50%)',
            width: '1000px',
            maxHeight: '340px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px 22px',
            boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
          }}
        >
          <span
            className="font-sans"
            style={{
              fontSize: '15px',
              color: '#6e6e6e',
              fontWeight: 500,
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Search for &ldquo;{value}&rdquo;
          </span>
          {matches.length === 0 ? (
            <span className="font-sans" style={{ fontSize: '16px', color: '#8e8e8e' }}>
              No matches.
            </span>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {matches.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/home/${moduleKey}/${b.slug}`}
                    onClick={onClose}
                    className="flex items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                    style={{
                      columnGap: '14px',
                      padding: '10px 4px',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.cover}
                      alt=""
                      style={{
                        width: '42px',
                        height: '56px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontSize: '18px',
                        fontWeight: 500,
                        color: '#222',
                      }}
                    >
                      {b.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Keyboard draggable */}
      <DraggableKeyboard storageKey="kiosk_keyboard_pos:brochures">
        <OnScreenKeyboard onKey={handleKey} />
      </DraggableKeyboard>
    </div>
  );
}
