'use client';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const SHEET_FG = 'hsl(var(--pwa-sheet-fg))';
const PWA = 'hsl(var(--pwa-primary))';

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Bottom sheet genérico de ordenamiento de la PWA: hoja clara anclada abajo
 * (sube con `pwa-sheet-up`), título + X, y una lista de opciones radio. Tap en
 * una opción la selecciona y cierra. Reutilizable por cualquier módulo con sort
 * (Deals lo usa con `DealSortOrder`). White-label: colores por tokens.
 */
export function PwaSortOverlay<T extends string>({
  open,
  title,
  options,
  value,
  onSelect,
  onCancel,
}: {
  open: boolean;
  title: string;
  options: SortOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onCancel: () => void;
}) {
  useEscapeToClose(open, onCancel);
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="absolute inset-0 z-50">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="pwa-sheet-backdrop-anim absolute inset-0 cursor-default"
        style={{ backgroundColor: 'rgba(18,18,18,0.45)' }}
      />

      {/* Hoja */}
      <div
        className="pwa-sheet-up-anim absolute inset-x-0 bottom-0 flex flex-col rounded-t-[22px]"
        style={{ backgroundColor: 'hsl(var(--pwa-sheet-bg))' }}
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-center pb-3 pt-[18px]">
          <h2 className="font-bold" style={{ fontSize: 17, color: SHEET_FG, ...OPEN_SANS }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: 14,
              right: 18,
              width: 32,
              height: 32,
              backgroundColor: 'hsl(var(--pwa-sheet-fg) / 0.06)',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke={SHEET_FG}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Opciones */}
        <div className="px-5 pb-8 pt-1">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className="flex w-full items-center justify-between"
                style={{ height: 52, borderTop: '1px solid hsl(var(--pwa-sheet-fg) / 0.08)' }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: SHEET_FG,
                    ...OPEN_SANS,
                  }}
                >
                  {opt.label}
                </span>
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    border: `1.5px solid ${active ? PWA : 'hsl(var(--pwa-sheet-fg) / 0.3)'}`,
                  }}
                >
                  {active ? (
                    <span
                      className="rounded-full"
                      style={{ width: 10, height: 10, backgroundColor: PWA }}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
