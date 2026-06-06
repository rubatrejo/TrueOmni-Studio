'use client';

import type { PwaMoreConfig, PwaMoreItem } from '@/lib/config';

import { move, PwaField, PwaGroup, PwaPanelHeader, ReorderButtons } from './pwa-ui';

/**
 * Editor del More Menu de la PWA. Edita los textos white-label (placeholder de
 * búsqueda, línea de clima) y los labels / orden de los items del menú. No se
 * añaden / borran items aquí porque su `key` mapea a rutas (cambiar la lista
 * rompería la navegación config-driven).
 */

const EMPTY: PwaMoreConfig = { searchPlaceholder: '', weatherText: '', items: [] };

export function MoreEditor({
  value,
  onChange,
}: {
  value: PwaMoreConfig | undefined;
  onChange: (next: PwaMoreConfig) => void;
}) {
  const v: PwaMoreConfig = { ...EMPTY, ...value, items: value?.items ?? [] };

  const updateItem = (i: number, patch: Partial<PwaMoreItem>) =>
    onChange({ ...v, items: v.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="More Menu"
        description="Search placeholder, weather line and the labels / order of the More menu entries."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField
            label="Search placeholder"
            value={v.searchPlaceholder}
            onChange={(searchPlaceholder) => onChange({ ...v, searchPlaceholder })}
          />
          <PwaField
            label="Weather line"
            value={v.weatherText}
            onChange={(weatherText) => onChange({ ...v, weatherText })}
          />
        </PwaGroup>

        <PwaGroup title="Menu items">
          {v.items.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
              No menu items configured.
            </p>
          ) : (
            v.items.map((it, i) => (
              <div key={it.key} className="flex items-start gap-2">
                <ReorderButtons
                  index={i}
                  count={v.items.length}
                  onMove={(to) => onChange({ ...v, items: move(v.items, i, to) })}
                />
                <div className="flex-1">
                  <PwaField
                    label={it.key}
                    value={it.label}
                    onChange={(label) => updateItem(i, { label })}
                  />
                </div>
              </div>
            ))
          )}
        </PwaGroup>
      </div>
    </div>
  );
}
