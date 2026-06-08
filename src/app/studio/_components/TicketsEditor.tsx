'use client';

import { useMemo } from 'react';

import type { EventsModule, TicketsModule } from '@/lib/studio/schema';

import { ImageUrlField } from './catalog/ImageUrlField';
import { TaxonomyEditor } from './catalog/TaxonomyEditor';

interface TicketsEditorProps {
  value: TicketsModule;
  /** Pool de events vivos — usado para derivar conteo de tickets visibles. */
  eventsValue: EventsModule;
  onChange: (next: TicketsModule) => void;
}

/**
 * Editor del módulo Tickets — wrapper derivado de events ticketables.
 * No edita items; configura label, hero, fallback hero, copy + categorías
 * visibles (subset de events.categories cuyas events son priceMode='paid').
 */
export function TicketsEditor({ value, eventsValue, onChange }: TicketsEditorProps) {
  const update = (patch: Partial<TicketsModule>) => onChange({ ...value, ...patch });

  // Categorías disponibles: las de Events que tienen al menos un event ticketable.
  const eligibleCategories = useMemo(() => {
    const set = new Set<string>();
    for (const ev of eventsValue.events) {
      if (ev.priceMode === 'paid' && ev.category) set.add(ev.category);
    }
    return Array.from(set);
  }, [eventsValue.events]);

  // Conteo de tickets visibles según categorías seleccionadas.
  const visibleTicketsCount = useMemo(() => {
    if (value.categories.length === 0) {
      return eventsValue.events.filter((e) => e.priceMode === 'paid').length;
    }
    const sel = new Set(value.categories);
    return eventsValue.events.filter((e) => e.priceMode === 'paid' && sel.has(e.category)).length;
  }, [eventsValue.events, value.categories]);

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11.5px] text-amber-700 dark:text-amber-200">
        Wrapper derived from events. Shows events with{' '}
        <code className="text-amber-600 dark:text-amber-300">priceMode = paid</code> filtered by the
        categories you select below.
      </p>

      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Module label
        </span>
        <input
          type="text"
          value={value.label}
          onChange={(e) => update({ label: e.target.value })}
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
        />
      </label>

      <ImageUrlField
        label="Hero image"
        value={value.heroImage}
        onChange={(next) => update({ heroImage: next ?? '' })}
      />

      <ImageUrlField
        label="Fallback hero (events without their own image)"
        value={value.fallbackHero}
        onChange={(next) => update({ fallbackHero: next ?? '' })}
        helpText="Used in detail pages of paid events that don't define their own image."
      />

      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Module copy
        </span>
        <textarea
          rows={3}
          value={value.copy}
          onChange={(e) => update({ copy: e.target.value })}
          placeholder="Optional intro copy shown above the tickets list."
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </label>

      <TaxonomyEditor
        label="Visible categories"
        items={value.categories}
        onChange={(next) => update({ categories: next })}
        availableOptions={eligibleCategories}
        helpText="Restricted to event categories that contain at least one paid event. Empty list = show all paid events."
      />

      <TaxonomyEditor
        label="Visible venues"
        items={value.venues}
        onChange={(next) => update({ venues: next })}
        availableOptions={eventsValue.venues}
        helpText="Optional. Empty = no venue restriction."
      />

      <TaxonomyEditor
        label="Visible features"
        items={value.features}
        onChange={(next) => update({ features: next })}
        availableOptions={eventsValue.features}
        helpText="Optional. Empty = derive features from the visible ticket pool."
      />

      <div className="rounded-md border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[12px] text-sky-700 dark:text-sky-200">
        {visibleTicketsCount === 0 ? (
          <>
            No paid events match the current selection.{' '}
            <span className="text-sky-600/70 dark:text-sky-300/70">
              Add paid events with these categories on the Events tab.
            </span>
          </>
        ) : (
          <>
            <strong>{visibleTicketsCount}</strong>{' '}
            {visibleTicketsCount === 1 ? 'ticket' : 'tickets'} visible across{' '}
            {value.categories.length === 0
              ? 'all categories'
              : `${value.categories.length} categor${value.categories.length === 1 ? 'y' : 'ies'}`}
            .
          </>
        )}
      </div>
    </div>
  );
}
