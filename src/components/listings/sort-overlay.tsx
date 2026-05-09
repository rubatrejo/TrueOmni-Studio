'use client';

import { useEscapeToClose } from './use-escape-to-close';

/** Entrada genérica de orden para el SortOverlay. */
export interface SortOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Overlay pequeño para elegir orden. No hay SVG para este overlay; el diseño
 * sigue el estilo del Filter (overlay dark + pills olive/blue al estilo del kit)
 * para mantener consistencia visual.
 *
 * Configurable: recibe `options: SortOptionItem[]` y `current: string`, de modo
 * que se pueda reutilizar desde Listings y Events (con sorts distintos).
 */
export function SortOverlay({
  open,
  current,
  options,
  title = 'SORT BY',
  onSelect,
  onCancel,
}: {
  open: boolean;
  current: string;
  options: readonly SortOptionItem[];
  title?: string;
  onSelect: (next: string) => void;
  onCancel: () => void;
}) {
  useEscapeToClose(open, onCancel);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sort-title"
      className="absolute inset-0 z-30 flex flex-col items-center"
      style={{ backgroundColor: 'rgba(18,18,18,0.92)', paddingTop: '180px' }}
    >
      <button
        type="button"
        aria-label="Cancelar orden"
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        tabIndex={-1}
      />
      <h2
        id="sort-title"
        className="relative font-sans text-white"
        style={{
          fontSize: '42px',
          lineHeight: '42px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          marginBottom: '60px',
        }}
      >
        {title}
      </h2>

      <div className="relative flex flex-col" style={{ rowGap: '20px', width: '520px' }}>
        {options.map(({ value, label, disabled = false }) => {
          const selected = current === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (disabled) return;
                onSelect(value);
              }}
              disabled={disabled}
              aria-pressed={selected}
              className="font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{
                height: '63.769px',
                borderRadius: '8px',
                border: '1.689px solid #fff',
                backgroundColor: selected ? '#ffffff' : 'transparent',
                color: selected
                  ? 'hsl(var(--brand-primary))'
                  : disabled
                    ? 'rgba(255,255,255,0.4)'
                    : '#ffffff',
                fontSize: '22px',
                lineHeight: '22px',
                fontWeight: selected ? 700 : 400,
                letterSpacing: '0.02em',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {label}
              {disabled ? ' (unavailable)' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
