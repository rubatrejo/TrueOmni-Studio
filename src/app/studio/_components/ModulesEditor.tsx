'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  Copy,
  GripVertical,
  Languages,
  Megaphone,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_SYSTEM_MODULES,
  MODULE_KEY_TO_SYSTEM_FIELD,
  defaultModules,
  duplicateListingEntry,
  makeBlankListingEntry,
  type ItineraryBuilderConfig,
  type ListingsCatalogEntry,
  type ListingsModule,
  type ModuleEntry,
  type ModulesConfig,
  type SystemModules,
} from '@/lib/studio/schema';

import { ImageField } from './ImageField';
import { IconNode, IconPickerGrid, LISTING_ICONS, MODULE_ICONS } from './modules/icons';
import { ConfirmDialog, ToggleSwitch } from './ui';

/* ────────────────────────────────────────────────────────────────────────── */
/* Home Dashboard Editor — drag&drop + rename + visibility de los tiles que   */
/* SÍ están enabled en SystemModules. Si Modules apaga "tickets", aquí no     */
/* aparece el tile de tickets.                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function HomeDashboardEditor({
  modules,
  listings,
  onChange,
}: {
  modules: ModulesConfig;
  /** Listings dinámicos para que cada tile pueda heredar su iconKey. */
  listings: ListingsModule;
  onChange: (next: ModulesConfig) => void;
}) {
  const sysModules = modules.systemModules ?? DEFAULT_SYSTEM_MODULES;
  const iconOverrides = modules.iconOverrides ?? {};
  const customIconsMap = modules.customIcons ?? {};
  const listingIconByKey = useMemo(() => {
    const map: Record<string, { iconKey?: string; customIcon?: string }> = {};
    for (const l of listings) map[l.key] = { iconKey: l.iconKey, customIcon: l.customIcon };
    return map;
  }, [listings]);

  /**
   * Resuelve par {iconKey, customIcon} para un tile con prioridad:
   *   1. modules.customIcons[key] (data URL explícito) — gana sobre todo.
   *   2. modules.iconOverrides[key] (Lucide explícito en Modules tab).
   *   3. listings[key].customIcon (custom de listing module).
   *   4. listings[key].iconKey (Lucide de listing module).
   *   5. MODULE_ICONS[key] como Lucide canónico.
   */
  const resolveTile = (tileKey: string): { iconKey?: string; customIcon?: string } => {
    if (customIconsMap[tileKey]) return { customIcon: customIconsMap[tileKey] };
    if (iconOverrides[tileKey]) return { iconKey: iconOverrides[tileKey] };
    const li = listingIconByKey[tileKey];
    if (li?.customIcon) return { customIcon: li.customIcon };
    if (li?.iconKey) return { iconKey: li.iconKey };
    // Caer al canónico — buscamos su key Lucide en LISTING_ICONS por nombre del componente.
    const canonical = MODULE_ICONS[tileKey];
    if (!canonical) return { iconKey: 'Sparkles' };
    // Reverse-lookup del LucideIcon → key registrada en LISTING_ICONS.
    for (const [k, v] of Object.entries(LISTING_ICONS)) if (v === canonical) return { iconKey: k };
    return { iconKey: 'Sparkles' };
  };

  const visibleTiles = useMemo(
    () =>
      modules.tiles.filter((t) => {
        const field = MODULE_KEY_TO_SYSTEM_FIELD[t.key];
        if (!field) return true;
        return sysModules[field];
      }),
    [modules.tiles, sysModules],
  );

  const enabledCount = useMemo(() => visibleTiles.filter((t) => t.enabled).length, [visibleTiles]);

  // El reorder solo actúa sobre los tiles VISIBLES; los hidden conservan su
  // posición relativa (los reinsertamos al final con su orden original).
  const handleReorder = (next: ModuleEntry[]) => {
    const visibleKeys = new Set(next.map((t) => t.key));
    const hidden = modules.tiles.filter((t) => !visibleKeys.has(t.key));
    onChange({ ...modules, tiles: [...next, ...hidden] });
  };

  const handleToggle = (key: string) =>
    onChange({
      ...modules,
      tiles: modules.tiles.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t)),
    });

  const handleLabel = (key: string, label: string) =>
    onChange({
      ...modules,
      tiles: modules.tiles.map((t) => (t.key === key ? { ...t, label } : t)),
    });

  const handleWide = (key: string, wide: boolean) =>
    onChange({
      ...modules,
      tiles: modules.tiles.map((t) => (t.key === key ? { ...t, wide } : t)),
    });

  const handleImage = (key: string, image: string | undefined) =>
    onChange({
      ...modules,
      tiles: modules.tiles.map((t) => (t.key === key ? { ...t, image: image ?? '' } : t)),
    });

  const handleReset = () => onChange({ ...defaultModules(), systemModules: modules.systemModules });

  return (
    <div className="space-y-7">
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Home tiles
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Drag to reorder · click to rename · toggle to hide from the grid.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-mono text-[10.5px] leading-tight text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              {enabledCount}/{visibleTiles.length} on
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
              title="Reset to default order, labels and visibility"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </header>

        {/* Tamaño global de la tipografía de los títulos de los tiles. Aplica
            a TODOS los tiles por igual para mantener el grid uniforme. */}
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-900 dark:bg-zinc-900/40">
          <label
            htmlFor="tile-title-font-size"
            className="shrink-0 text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300"
          >
            Title size
          </label>
          <input
            id="tile-title-font-size"
            type="range"
            min={20}
            max={120}
            step={1}
            value={modules.tileTitleFontSize ?? 50}
            onChange={(e) => onChange({ ...modules, tileTitleFontSize: Number(e.target.value) })}
            className="h-1.5 flex-1 cursor-pointer accent-sky-500"
          />
          <span className="w-12 shrink-0 text-right font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {modules.tileTitleFontSize ?? 50}px
          </span>
          {modules.tileTitleFontSize !== undefined && modules.tileTitleFontSize !== 50 ? (
            <button
              type="button"
              onClick={() => {
                const next = { ...modules };
                delete next.tileTitleFontSize;
                onChange(next);
              }}
              title="Reset to default (50px)"
              className="shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-sky-500/30 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-sky-300"
            >
              Reset
            </button>
          ) : null}
        </div>

        {visibleTiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20">
            No modules enabled. Turn modules on in the <strong>Modules</strong> tab to start
            arranging the Home grid.
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={visibleTiles}
            onReorder={handleReorder}
            className="flex flex-col gap-1.5"
          >
            {visibleTiles.map((entry) => {
              const tileIcon = resolveTile(entry.key);
              return (
                <ModuleRow
                  key={entry.key}
                  entry={entry}
                  iconKey={tileIcon.iconKey}
                  customIcon={tileIcon.customIcon}
                  onToggle={() => handleToggle(entry.key)}
                  onLabel={(label) => handleLabel(entry.key, label)}
                  onWide={(wide) => handleWide(entry.key, wide)}
                  onImage={(image) => handleImage(entry.key, image)}
                />
              );
            })}
          </Reorder.Group>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* System Modules Editor — master switches. 16 tiles + 3 globales (ads,       */
/* languages, ai avatar).                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * "Catalog-style" system modules — datos vienen de un catálogo dedicado.
 * Comparten la sección "Listing modules" con los listings dinámicos del
 * usuario, aunque su schema sea propio (Events, Trails) y no se puedan
 * duplicar/borrar.
 */
/** Lista de side-effects (cascadas) por módulo. Audit F-09: comunicar al
 *  operador que toggle off no solo apaga la sección — también esconde el
 *  tile del Home Dashboard, las claves de i18n, etc. */
const CASCADE_HOME_TILE = 'Home Dashboard tile · Sidebar editor';
const CASCADE_HOME_TILE_AND_I18N = 'Home Dashboard tile · Sidebar editor · Languages columns';

const CATALOG_SYSTEM_MODULE_LIST: Array<{
  key: keyof SystemModules;
  tileKey: string;
  label: string;
  subtitle: string;
  cascade: string;
}> = [
  {
    key: 'events',
    tileKey: 'events',
    label: 'Events',
    subtitle: 'Calendar of events',
    cascade: CASCADE_HOME_TILE_AND_I18N,
  },
  {
    key: 'tickets',
    tileKey: 'tickets',
    label: 'Tickets',
    subtitle: 'Single-attraction tickets (derived)',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'passes',
    tileKey: 'passes',
    label: 'Passes',
    subtitle: 'Multi-attraction passes',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'trails',
    tileKey: 'trails',
    label: 'Trails',
    subtitle: 'Hiking / walking trails',
    cascade: CASCADE_HOME_TILE,
  },
];

const HOME_MODULE_LIST: Array<{
  key: keyof SystemModules;
  tileKey: string;
  label: string;
  subtitle: string;
  cascade: string;
}> = [
  {
    key: 'itineraryBuilder',
    tileKey: 'itinerary-builder',
    label: 'Trip Planner',
    subtitle: 'AI-assisted trip planner',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'guestbook',
    tileKey: 'guestbook',
    label: 'Guestbook',
    subtitle: 'Visitor pins on the map',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'socialWall',
    tileKey: 'social-wall',
    label: 'Social Wall',
    subtitle: 'Curated social feed',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'digitalBrochure',
    tileKey: 'digital-brochure',
    label: 'Digital Brochure',
    subtitle: 'Flippable brochures',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'map',
    tileKey: 'map',
    label: 'Map',
    subtitle: 'Interactive POI map',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'survey',
    tileKey: 'survey',
    label: 'Survey',
    subtitle: 'NPS / feedback overlay',
    cascade: 'Sidebar editor',
  },
  {
    key: 'deals',
    tileKey: 'deals',
    label: 'Deals',
    subtitle: 'Promotions & discounts',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'photoBooth',
    tileKey: 'photo-booth',
    label: 'Photo Booth',
    subtitle: 'Green-screen capture',
    cascade: CASCADE_HOME_TILE,
  },
  {
    key: 'wayfinding',
    tileKey: 'wayfinding',
    label: 'Wayfinding',
    subtitle: 'On-property navigation',
    cascade: CASCADE_HOME_TILE,
  },
];

const GLOBAL_MODULE_LIST: Array<{
  key: keyof SystemModules;
  icon: LucideIcon;
  label: string;
  subtitle: string;
  cascade: string;
}> = [
  {
    key: 'ads',
    icon: Megaphone,
    label: 'Ads',
    subtitle: 'Hero, bottom banner, popup interstitial',
    cascade: 'Hero / bottom / popup ad slots kiosk-wide',
  },
  {
    key: 'languages',
    icon: Languages,
    label: 'Languages',
    subtitle: 'Locale picker on the Billboard',
    cascade: 'Billboard locale picker · Sidebar Languages editor',
  },
  {
    key: 'aiAvatar',
    icon: Sparkles,
    label: 'AI Avatar',
    subtitle: 'Floating Ask Anything bubble',
    cascade: 'Ask Anything bubble · Sidebar AI Avatar editor',
  },
];

export function SystemModulesEditor({
  modules,
  onChange,
  listings,
  onListingsChange,
  itinerary,
  onItineraryChange,
}: {
  modules: ModulesConfig;
  onChange: (next: ModulesConfig) => void;
  listings: ListingsModule;
  onListingsChange: (next: ListingsModule) => void;
  /** Trip Planner config — para auto-sync de option `activities` cuando se
   *  añade/borra/renombra un listing module. */
  itinerary?: ItineraryBuilderConfig;
  onItineraryChange?: (next: ItineraryBuilderConfig) => void;
}) {
  const sys: SystemModules = modules.systemModules ?? DEFAULT_SYSTEM_MODULES;
  const catalogSysKeys = CATALOG_SYSTEM_MODULE_LIST.map((m) => m.key);
  const homeKeys = HOME_MODULE_LIST.map((m) => m.key);
  const globalKeys = GLOBAL_MODULE_LIST.map((m) => m.key);
  const enabledCount =
    catalogSysKeys.filter((k) => sys[k]).length +
    homeKeys.filter((k) => sys[k]).length +
    globalKeys.filter((k) => sys[k]).length +
    listings.filter((e) => e.enabled).length;
  const totalCount = catalogSysKeys.length + homeKeys.length + globalKeys.length + listings.length;

  const setSystem = (k: keyof SystemModules) =>
    onChange({ ...modules, systemModules: { ...sys, [k]: !sys[k] } });

  const iconOverrides = modules.iconOverrides ?? {};
  const customIcons = modules.customIcons ?? {};
  const setIconOverride = (moduleKey: string, iconKey: string) =>
    onChange({
      ...modules,
      iconOverrides: { ...iconOverrides, [moduleKey]: iconKey },
      // Limpiar custom cuando se elige un Lucide nuevo.
      customIcons: { ...customIcons, [moduleKey]: '' },
    });
  const setCustomIcon = (moduleKey: string, dataUrl: string) =>
    onChange({
      ...modules,
      customIcons: { ...customIcons, [moduleKey]: dataUrl },
    });
  const resolveIcon = (canonical: LucideIcon, moduleKey: string): LucideIcon => {
    const override = iconOverrides[moduleKey];
    if (override && LISTING_ICONS[override]) return LISTING_ICONS[override];
    return canonical;
  };

  const handleReset = () => onChange({ ...modules, systemModules: { ...DEFAULT_SYSTEM_MODULES } });

  /* ---------------- Listing modules CRUD (sync con tiles) ----------------- */

  const updateListingsAndTiles = (
    nextListings: ListingsModule,
    transformTiles?: (tiles: ModuleEntry[]) => ModuleEntry[],
  ) => {
    onListingsChange(nextListings);
    if (transformTiles) {
      onChange({ ...modules, tiles: transformTiles(modules.tiles) });
    }
  };

  /* ---------------- Trip Planner auto-sync (audit feedback) -------------- */
  /**
   * Cuando se añade/borra/renombra un listing module, sincroniza la option
   * correspondiente en el AI question `activities` del Trip Planner. Permite
   * que el operador NO tenga que ir al editor del Trip Planner a mano.
   */
  const syncItineraryActivity = (
    op:
      | { type: 'add'; key: string; label: string }
      | { type: 'delete'; key: string }
      | { type: 'renameKey'; oldKey: string; newKey: string }
      | { type: 'renameLabel'; key: string; label: string },
  ) => {
    if (!itinerary || !onItineraryChange) return;
    const qIdx = itinerary.questions.findIndex((q) => q.key === 'activities');
    if (qIdx === -1) return;
    const q = itinerary.questions[qIdx]!;
    let nextOptions = q.options;
    if (op.type === 'add') {
      // No duplicar si ya existe option con ese categoryKey o value.
      if (q.options.some((o) => o.categoryKey === op.key || o.value === op.key)) return;
      nextOptions = [...q.options, { value: op.key, label: op.label, categoryKey: op.key }];
    } else if (op.type === 'delete') {
      nextOptions = q.options.filter((o) => o.categoryKey !== op.key && o.value !== op.key);
      if (nextOptions.length === q.options.length) return;
    } else if (op.type === 'renameKey') {
      nextOptions = q.options.map((o) =>
        o.categoryKey === op.oldKey || o.value === op.oldKey
          ? { ...o, value: op.newKey, categoryKey: op.newKey }
          : o,
      );
    } else if (op.type === 'renameLabel') {
      nextOptions = q.options.map((o) =>
        o.categoryKey === op.key || o.value === op.key ? { ...o, label: op.label } : o,
      );
    }
    if (nextOptions === q.options) return;
    const nextQuestions = itinerary.questions.slice();
    nextQuestions[qIdx] = { ...q, options: nextOptions };
    onItineraryChange({ ...itinerary, questions: nextQuestions });
  };

  const handleListingToggle = (key: string) => {
    const entry = listings.find((e) => e.key === key);
    if (!entry) return;
    const nextEnabled = !entry.enabled;
    updateListingsAndTiles(
      listings.map((e) => (e.key === key ? { ...e, enabled: nextEnabled } : e)),
      (tiles) => tiles.map((t) => (t.key === key ? { ...t, enabled: nextEnabled } : t)),
    );
  };

  const handleListingRename = (key: string, label: string) => {
    updateListingsAndTiles(
      listings.map((e) => (e.key === key ? { ...e, label } : e)),
      (tiles) => tiles.map((t) => (t.key === key ? { ...t, label } : t)),
    );
    syncItineraryActivity({ type: 'renameLabel', key, label });
  };

  const handleListingRenameKey = (oldKey: string, rawNewKey: string) => {
    const newKey = rawNewKey
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!newKey || newKey === oldKey) return;
    if (listings.some((e) => e.key === newKey)) return; // colisión: ignora silently
    updateListingsAndTiles(
      listings.map((e) => (e.key === oldKey ? { ...e, key: newKey } : e)),
      (tiles) => tiles.map((t) => (t.key === oldKey ? { ...t, key: newKey } : t)),
    );
    syncItineraryActivity({ type: 'renameKey', oldKey, newKey });
  };

  const handleListingIconChange = (key: string, iconKey: string) => {
    updateListingsAndTiles(
      listings.map((e) => (e.key === key ? { ...e, iconKey, customIcon: '' } : e)),
      (tiles) => tiles,
    );
  };

  const handleListingCustomIcon = (key: string, customIcon: string) => {
    updateListingsAndTiles(
      listings.map((e) => (e.key === key ? { ...e, customIcon } : e)),
      (tiles) => tiles,
    );
  };

  const handleListingDuplicate = (key: string) => {
    const source = listings.find((e) => e.key === key);
    if (!source) return;
    const dup = duplicateListingEntry(source, listings);
    updateListingsAndTiles([...listings, dup], (tiles) => {
      // Inserta el tile nuevo justo después del source si existe; si no, al final.
      const idx = tiles.findIndex((t) => t.key === source.key);
      const newTile: ModuleEntry = { key: dup.key, label: dup.label, enabled: dup.enabled };
      if (idx === -1) return [...tiles, newTile];
      const next = tiles.slice();
      next.splice(idx + 1, 0, newTile);
      return next;
    });
    syncItineraryActivity({ type: 'add', key: dup.key, label: dup.label });
  };

  const [confirmDelete, setConfirmDelete] = useState<{ key: string; label: string } | null>(null);

  const handleListingDelete = (key: string) => {
    updateListingsAndTiles(
      listings.filter((e) => e.key !== key),
      (tiles) => tiles.filter((t) => t.key !== key),
    );
    syncItineraryActivity({ type: 'delete', key });
    setConfirmDelete(null);
  };

  const [showAdd, setShowAdd] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');

  const handleListingAdd = () => {
    const label = draftLabel.trim();
    if (!label) return;
    const entry = makeBlankListingEntry(label, listings);
    updateListingsAndTiles([...listings, entry], (tiles) => [
      ...tiles,
      { key: entry.key, label: entry.label, enabled: true },
    ]);
    syncItineraryActivity({ type: 'add', key: entry.key, label: entry.label });
    setDraftLabel('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-7">
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Listing modules
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Catalog-style modules. Duplicate, rename or delete to fit each client.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-mono text-[10.5px] leading-tight text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              {enabledCount}/{totalCount} on
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-1.5">
          {listings.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
              <p className="text-[11.5px] italic text-zinc-500">
                No listing modules. Add one below to start a fresh catalog.
              </p>
            </div>
          ) : (
            listings.map((entry) => {
              const itemCount = entry.catalog.listings.length;
              return (
                <ListingModuleRow
                  key={entry.key}
                  entry={entry}
                  itemCount={itemCount}
                  onToggle={() => handleListingToggle(entry.key)}
                  onRename={(label) => handleListingRename(entry.key, label)}
                  onRenameKey={(newKey) => handleListingRenameKey(entry.key, newKey)}
                  onIconChange={(iconKey) => handleListingIconChange(entry.key, iconKey)}
                  onCustomIcon={(dataUrl) => handleListingCustomIcon(entry.key, dataUrl)}
                  onDuplicate={() => handleListingDuplicate(entry.key)}
                  onDelete={() => setConfirmDelete({ key: entry.key, label: entry.label })}
                />
              );
            })
          )}

          {/* System catalog modules (Events, Tickets, Passes, Trails) — same
              "data-driven" category but not duplicatable. */}
          {CATALOG_SYSTEM_MODULE_LIST.map((m) => {
            const Icon = resolveIcon(MODULE_ICONS[m.tileKey] ?? Sparkles, m.tileKey);
            return (
              <SystemRow
                key={m.key}
                icon={<Icon className="h-4 w-4" />}
                iconKey={iconOverrides[m.tileKey]}
                customIcon={customIcons[m.tileKey]}
                title={m.label}
                subtitle={m.subtitle}
                cascade={m.cascade}
                enabled={sys[m.key]}
                onToggle={() => setSystem(m.key)}
                onIconChange={(iconKey) => setIconOverride(m.tileKey, iconKey)}
                onCustomIcon={(dataUrl) => setCustomIcon(m.tileKey, dataUrl)}
              />
            );
          })}

          {showAdd ? (
            <div className="flex items-center gap-2 rounded-md border border-sky-500/40 bg-sky-500/5 p-2">
              <input
                type="text"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleListingAdd();
                  if (e.key === 'Escape') {
                    setDraftLabel('');
                    setShowAdd(false);
                  }
                }}
                placeholder="Module name (e.g. Shopping)"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={handleListingAdd}
                disabled={!draftLabel.trim()}
                className="rounded-md bg-sky-500/20 px-2.5 py-1 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/30 disabled:opacity-40 dark:text-sky-200"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftLabel('');
                  setShowAdd(false);
                }}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-sky-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add listing module
            </button>
          )}
        </div>

        {confirmDelete
          ? (() => {
              const itemCount =
                listings.find((e) => e.key === confirmDelete.key)?.catalog.listings.length ?? 0;
              return (
                <ConfirmDialog
                  id="listing-module-delete"
                  title={`Delete "${confirmDelete.label}"?`}
                  description={
                    itemCount === 0
                      ? 'The module is empty — safe to delete.'
                      : `This will remove ${itemCount} listing${
                          itemCount === 1 ? '' : 's'
                        }, plus its subcategories and features. This cannot be undone.`
                  }
                  onCancel={() => setConfirmDelete(null)}
                  onConfirm={() => handleListingDelete(confirmDelete.key)}
                />
              );
            })()
          : null}
      </section>

      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Home modules
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Other tiles in the Home grid. Toggle off to hide them across the kiosk.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          {HOME_MODULE_LIST.map((m) => {
            const Icon = resolveIcon(MODULE_ICONS[m.tileKey] ?? Sparkles, m.tileKey);
            return (
              <SystemRow
                key={m.key}
                icon={<Icon className="h-4 w-4" />}
                iconKey={iconOverrides[m.tileKey]}
                customIcon={customIcons[m.tileKey]}
                title={m.label}
                subtitle={m.subtitle}
                cascade={m.cascade}
                enabled={sys[m.key]}
                onToggle={() => setSystem(m.key)}
                onIconChange={(iconKey) => setIconOverride(m.tileKey, iconKey)}
                onCustomIcon={(dataUrl) => setCustomIcon(m.tileKey, dataUrl)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Global modules
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Run kiosk-wide and aren&apos;t tiles in the Home grid.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          {GLOBAL_MODULE_LIST.map((m) => (
            <SystemRow
              key={m.key}
              icon={<m.icon className="h-4 w-4" />}
              title={m.label}
              subtitle={m.subtitle}
              cascade={m.cascade}
              enabled={sys[m.key]}
              onToggle={() => setSystem(m.key)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function SystemRow({
  icon,
  iconKey,
  customIcon,
  title,
  subtitle,
  cascade,
  enabled,
  onToggle,
  onIconChange,
  onCustomIcon,
}: {
  icon: React.ReactNode;
  /** Si se pasa, habilita el icon picker para overrides en `modules.iconOverrides`. */
  iconKey?: string;
  customIcon?: string;
  title: string;
  subtitle: string;
  /** Lista de side-effects al togglear este módulo (audit F-09). */
  cascade?: string;
  enabled: boolean;
  onToggle: () => void;
  onIconChange?: (iconKey: string) => void;
  onCustomIcon?: (dataUrl: string) => void;
}) {
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const cascadeMsg = cascade
    ? `Toggling ${title} ${enabled ? 'off' : 'on'} also affects: ${cascade}`
    : undefined;
  const isInteractiveIcon = !!onIconChange;
  return (
    <div
      className={
        'relative flex items-center gap-2.5 rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
      {isInteractiveIcon ? (
        <button
          type="button"
          onClick={() => setIconMenuOpen((v) => !v)}
          title="Change icon"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 transition hover:scale-105 hover:bg-sky-500/10 hover:text-sky-700 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:text-sky-300"
        >
          {customIcon ? <IconNode customIcon={customIcon} className="h-4 w-4" /> : icon}
        </button>
      ) : (
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
          aria-hidden
        >
          {icon}
        </span>
      )}
      {iconMenuOpen && onIconChange ? (
        <div className="absolute left-2 top-12 z-20">
          <IconPickerGrid
            selectedKey={iconKey}
            customIcon={customIcon}
            onPick={(key) => {
              onIconChange(key);
              setIconMenuOpen(false);
            }}
            onCustomChange={(dataUrl) => {
              onCustomIcon?.(dataUrl);
              if (dataUrl) setIconMenuOpen(false);
            }}
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
          {subtitle}
        </div>
        {cascade ? (
          <div
            className="mt-1 truncate text-[10px] text-zinc-400 dark:text-zinc-600"
            title={cascadeMsg}
          >
            <span className="font-mono uppercase tracking-wide">Cascades to:</span> {cascade}
          </div>
        ) : null}
      </div>
      <ToggleSwitch enabled={enabled} onChange={onToggle} label={title} title={cascadeMsg} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Home Dashboard tile row                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function ModuleRow({
  entry,
  iconKey,
  customIcon,
  onToggle,
  onLabel,
  onWide,
  onImage,
}: {
  entry: ModuleEntry;
  /** Pareja resuelta por el caller: prioridad customIcon > iconKey Lucide. */
  iconKey?: string;
  customIcon?: string;
  onToggle: () => void;
  onLabel: (label: string) => void;
  onWide: (wide: boolean) => void;
  onImage: (image: string | undefined) => void;
}) {
  const dragControls = useDragControls();
  const [editing, setEditing] = useState(false);
  const displayLabel = entry.label.replace(/\n/g, ' ');
  const [draft, setDraft] = useState(displayLabel);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(displayLabel);
  }, [displayLabel, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.replace(/\s+/g, ' ').trim();
    if (next.length > 0 && next !== displayLabel) onLabel(next);
    else setDraft(displayLabel);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(displayLabel);
    setEditing(false);
  };

  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={dragControls}
      className={
        'group relative block rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (entry.enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${entry.label}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
          aria-hidden
        >
          <IconNode iconKey={iconKey} customIcon={customIcon} className="h-4 w-4" />
        </span>

        <div className="flex flex-1 flex-col">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancel();
                }
              }}
              className="h-7 w-full rounded-md border border-sky-500/50 bg-white px-2 font-display text-[12.5px] font-medium leading-none text-zinc-900 outline-none ring-2 ring-sky-500/20 dark:bg-zinc-950 dark:text-white"
              spellCheck={false}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="block cursor-text truncate rounded-md px-2 py-0.5 text-left font-display text-[12.5px] font-medium leading-snug text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
              title="Click to rename"
            >
              {displayLabel}
            </button>
          )}
          <span className="px-2 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
            /home/{entry.key}
          </span>
        </div>

        {/* Full-width: el tile ocupa las 2 columnas del grid. */}
        <button
          type="button"
          onClick={() => onWide(!entry.wide)}
          aria-pressed={entry.wide ?? false}
          title={
            entry.wide
              ? 'Full width tile (spans 2 columns)'
              : 'Make this tile full width (2 columns)'
          }
          className={
            'shrink-0 rounded-md border px-1.5 py-1 text-[10px] font-semibold transition ' +
            ((entry.wide ?? false)
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:border-sky-400/40 dark:text-sky-300'
              : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500')
          }
        >
          Wide
        </button>

        <ToggleSwitch enabled={entry.enabled} onChange={onToggle} label={entry.label} />
      </div>

      {/* Imagen de fondo del tile — editable como en el editor PWA. */}
      <div className="mt-2 pl-[30px]">
        <ImageField
          layout="compact"
          label="Tile image"
          hint="Background photo · JPG · PNG"
          value={entry.image}
          onChange={onImage}
        />
      </div>
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Toggle                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────── */
/* ListingModuleRow — fila de un Listing module dinámico con CRUD inline      */
/* ────────────────────────────────────────────────────────────────────────── */

function ListingModuleRow({
  entry,
  itemCount,
  onToggle,
  onRename,
  onRenameKey,
  onIconChange,
  onCustomIcon,
  onDuplicate,
  onDelete,
}: {
  entry: ListingsCatalogEntry;
  itemCount: number;
  onToggle: () => void;
  onRename: (label: string) => void;
  onRenameKey: (newKey: string) => void;
  onIconChange: (iconKey: string) => void;
  onCustomIcon: (dataUrl: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.label);
  useEffect(() => setDraft(entry.label), [entry.label]);
  const [editingKey, setEditingKey] = useState(false);
  const [draftKey, setDraftKey] = useState(entry.key);
  useEffect(() => setDraftKey(entry.key), [entry.key]);
  const [iconMenuOpen, setIconMenuOpen] = useState(false);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== entry.label) onRename(next);
    setEditing(false);
  };

  const commitKey = () => {
    if (draftKey && draftKey !== entry.key) onRenameKey(draftKey);
    setEditingKey(false);
  };

  return (
    <div className="relative flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-2 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
      <button
        type="button"
        onClick={() => setIconMenuOpen((v) => !v)}
        title="Change icon"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 transition hover:scale-105 ${
          entry.enabled
            ? 'bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-400 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-600 dark:ring-zinc-700'
        }`}
      >
        <IconNode iconKey={entry.iconKey} customIcon={entry.customIcon} className="h-4 w-4" />
      </button>

      {iconMenuOpen ? (
        <div className="absolute left-2 top-9 z-20">
          <IconPickerGrid
            selectedKey={entry.iconKey}
            customIcon={entry.customIcon}
            onPick={(key) => {
              onIconChange(key);
              setIconMenuOpen(false);
            }}
            onCustomChange={(dataUrl) => {
              onCustomIcon(dataUrl);
              if (dataUrl) setIconMenuOpen(false);
            }}
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(entry.label);
                setEditing(false);
              }
            }}
            className="w-full rounded border border-sky-500/40 bg-white px-1.5 py-0.5 text-[12.5px] font-medium text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full truncate text-left text-[12.5px] font-medium text-zinc-800 hover:text-sky-600 dark:text-zinc-200 dark:hover:text-sky-300"
          >
            {entry.label}
          </button>
        )}
        <div className="truncate text-[10.5px] text-zinc-500">
          {editingKey ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-zinc-500">/</span>
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                type="text"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                onBlur={commitKey}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitKey();
                  if (e.key === 'Escape') {
                    setDraftKey(entry.key);
                    setEditingKey(false);
                  }
                }}
                className="rounded border border-sky-500/40 bg-white px-1 font-mono text-[10px] text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:text-zinc-300"
                size={Math.max(draftKey.length, 8)}
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setEditingKey(true)}
              title="Edit slug"
              className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-600 transition hover:bg-sky-500/10 hover:text-sky-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-sky-300"
            >
              /{entry.key}
            </button>
          )}{' '}
          · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
      </div>

      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicate ${entry.label}`}
        title="Duplicate"
        className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-sky-500/10 hover:text-sky-600 dark:text-zinc-500 dark:hover:text-sky-300"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${entry.label}`}
        title="Delete"
        className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ToggleSwitch enabled={entry.enabled} onChange={onToggle} label={entry.label} />
    </div>
  );
}
