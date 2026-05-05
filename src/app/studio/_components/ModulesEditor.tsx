'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  BedDouble,
  BookOpen,
  Calendar,
  Camera,
  ClipboardList,
  Compass,
  Copy,
  Eye,
  EyeOff,
  Footprints,
  GripVertical,
  Hotel,
  Languages,
  ListChecks,
  Map,
  MapPin,
  Megaphone,
  PenSquare,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_SYSTEM_MODULES,
  MODULE_KEY_TO_SYSTEM_FIELD,
  defaultModules,
  duplicateListingEntry,
  makeBlankListingEntry,
  type ListingsCatalogEntry,
  type ListingsModule,
  type ModuleEntry,
  type ModulesConfig,
  type SystemModules,
} from '@/lib/studio/schema';

/* ────────────────────────────────────────────────────────────────────────── */
/* Iconos Lucide por module key — reemplazan los emojis del primer iter.      */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Catálogo de iconos Lucide disponibles para listing modules.
 * Las keys son los nombres tal cual los serializa el schema (ListingsCatalogEntry.iconKey).
 */
const LISTING_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  MapPin,
  BedDouble,
  Sparkles,
  Compass,
  ListChecks,
  Footprints,
  Hotel,
  BookOpen,
  Tag,
  Camera,
  PenSquare,
  Share2,
  ClipboardList,
  Map,
};

const MODULE_ICONS: Record<string, LucideIcon> = {
  restaurants: UtensilsCrossed,
  'things-to-do': MapPin,
  'itinerary-builder': ListChecks,
  events: Calendar,
  passes: TicketCheck,
  tickets: Ticket,
  guestbook: PenSquare,
  'social-wall': Share2,
  'digital-brochure': BookOpen,
  map: Map,
  stay: Hotel,
  survey: ClipboardList,
  deals: Tag,
  'photo-booth': Camera,
  trails: Footprints,
  wayfinding: Compass,
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Home Dashboard Editor — drag&drop + rename + visibility de los tiles que   */
/* SÍ están enabled en SystemModules. Si Modules apaga "tickets", aquí no     */
/* aparece el tile de tickets.                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function HomeDashboardEditor({
  modules,
  onChange,
}: {
  modules: ModulesConfig;
  onChange: (next: ModulesConfig) => void;
}) {
  const sysModules = modules.systemModules ?? DEFAULT_SYSTEM_MODULES;

  const visibleTiles = useMemo(
    () =>
      modules.tiles.filter((t) => {
        const field = MODULE_KEY_TO_SYSTEM_FIELD[t.key];
        if (!field) return true;
        return sysModules[field];
      }),
    [modules.tiles, sysModules],
  );

  const enabledCount = useMemo(
    () => visibleTiles.filter((t) => t.enabled).length,
    [visibleTiles],
  );

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

  const handleReset = () =>
    onChange({ ...defaultModules(), systemModules: modules.systemModules });

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
            {visibleTiles.map((entry) => (
              <ModuleRow
                key={entry.key}
                entry={entry}
                onToggle={() => handleToggle(entry.key)}
                onLabel={(label) => handleLabel(entry.key, label)}
              />
            ))}
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
  { key: 'events', tileKey: 'events', label: 'Events', subtitle: 'Calendar of events', cascade: CASCADE_HOME_TILE_AND_I18N },
  { key: 'tickets', tileKey: 'tickets', label: 'Tickets', subtitle: 'Single-attraction tickets (derived)', cascade: CASCADE_HOME_TILE },
  { key: 'passes', tileKey: 'passes', label: 'Passes', subtitle: 'Multi-attraction passes', cascade: CASCADE_HOME_TILE },
  { key: 'trails', tileKey: 'trails', label: 'Trails', subtitle: 'Hiking / walking trails', cascade: CASCADE_HOME_TILE },
];

const HOME_MODULE_LIST: Array<{
  key: keyof SystemModules;
  tileKey: string;
  label: string;
  subtitle: string;
  cascade: string;
}> = [
  { key: 'itineraryBuilder', tileKey: 'itinerary-builder', label: 'Trip Builder', subtitle: 'AI-assisted trip planner', cascade: CASCADE_HOME_TILE },
  { key: 'guestbook', tileKey: 'guestbook', label: 'Guestbook', subtitle: 'Visitor pins on the map', cascade: CASCADE_HOME_TILE },
  { key: 'socialWall', tileKey: 'social-wall', label: 'Social Wall', subtitle: 'Curated social feed', cascade: CASCADE_HOME_TILE },
  { key: 'digitalBrochure', tileKey: 'digital-brochure', label: 'Digital Brochure', subtitle: 'Flippable brochures', cascade: CASCADE_HOME_TILE },
  { key: 'map', tileKey: 'map', label: 'Map', subtitle: 'Interactive POI map', cascade: CASCADE_HOME_TILE },
  { key: 'survey', tileKey: 'survey', label: 'Survey', subtitle: 'NPS / feedback overlay', cascade: 'Sidebar editor' },
  { key: 'deals', tileKey: 'deals', label: 'Deals', subtitle: 'Promotions & discounts', cascade: CASCADE_HOME_TILE },
  { key: 'photoBooth', tileKey: 'photo-booth', label: 'Photo Booth', subtitle: 'Green-screen capture', cascade: CASCADE_HOME_TILE },
  { key: 'wayfinding', tileKey: 'wayfinding', label: 'Wayfinding', subtitle: 'On-property navigation', cascade: CASCADE_HOME_TILE },
];

const GLOBAL_MODULE_LIST: Array<{
  key: keyof SystemModules;
  icon: LucideIcon;
  label: string;
  subtitle: string;
  cascade: string;
}> = [
  { key: 'ads', icon: Megaphone, label: 'Ads', subtitle: 'Hero, bottom banner, popup interstitial', cascade: 'Hero / bottom / popup ad slots kiosk-wide' },
  { key: 'languages', icon: Languages, label: 'Languages', subtitle: 'Locale picker on the Billboard', cascade: 'Billboard locale picker · Sidebar Languages editor' },
  { key: 'aiAvatar', icon: Sparkles, label: 'AI Avatar', subtitle: 'Floating Ask Anything bubble', cascade: 'Ask Anything bubble · Sidebar AI Avatar editor' },
];

export function SystemModulesEditor({
  modules,
  onChange,
  listings,
  onListingsChange,
}: {
  modules: ModulesConfig;
  onChange: (next: ModulesConfig) => void;
  listings: ListingsModule;
  onListingsChange: (next: ListingsModule) => void;
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
  const totalCount =
    catalogSysKeys.length + homeKeys.length + globalKeys.length + listings.length;

  const setSystem = (k: keyof SystemModules) =>
    onChange({ ...modules, systemModules: { ...sys, [k]: !sys[k] } });

  const handleReset = () =>
    onChange({ ...modules, systemModules: { ...DEFAULT_SYSTEM_MODULES } });

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

  const handleListingToggle = (key: string) => {
    const entry = listings.find((e) => e.key === key);
    if (!entry) return;
    const nextEnabled = !entry.enabled;
    updateListingsAndTiles(
      listings.map((e) => (e.key === key ? { ...e, enabled: nextEnabled } : e)),
      (tiles) =>
        tiles.map((t) => (t.key === key ? { ...t, enabled: nextEnabled } : t)),
    );
  };

  const handleListingRename = (key: string, label: string) => {
    updateListingsAndTiles(
      listings.map((e) => (e.key === key ? { ...e, label } : e)),
      (tiles) => tiles.map((t) => (t.key === key ? { ...t, label } : t)),
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
  };

  const [confirmDelete, setConfirmDelete] = useState<{ key: string; label: string } | null>(null);

  const handleListingDelete = (key: string) => {
    updateListingsAndTiles(
      listings.filter((e) => e.key !== key),
      (tiles) => tiles.filter((t) => t.key !== key),
    );
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
              const Icon = LISTING_ICONS[entry.iconKey] ?? UtensilsCrossed;
              const itemCount = entry.catalog.listings.length;
              return (
                <ListingModuleRow
                  key={entry.key}
                  icon={<Icon className="h-4 w-4" />}
                  entry={entry}
                  itemCount={itemCount}
                  onToggle={() => handleListingToggle(entry.key)}
                  onRename={(label) => handleListingRename(entry.key, label)}
                  onDuplicate={() => handleListingDuplicate(entry.key)}
                  onDelete={() => setConfirmDelete({ key: entry.key, label: entry.label })}
                />
              );
            })
          )}

          {/* System catalog modules (Events, Tickets, Passes, Trails) — same
              "data-driven" category but not duplicatable. */}
          {CATALOG_SYSTEM_MODULE_LIST.map((m) => {
            const Icon = MODULE_ICONS[m.tileKey] ?? Sparkles;
            return (
              <SystemRow
                key={m.key}
                icon={<Icon className="h-4 w-4" />}
                title={m.label}
                subtitle={m.subtitle}
                cascade={m.cascade}
                enabled={sys[m.key]}
                onToggle={() => setSystem(m.key)}
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

        {confirmDelete ? (
          <DeleteConfirm
            label={confirmDelete.label}
            itemCount={
              listings.find((e) => e.key === confirmDelete.key)?.catalog.listings.length ?? 0
            }
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleListingDelete(confirmDelete.key)}
          />
        ) : null}
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
            const Icon = MODULE_ICONS[m.tileKey] ?? Sparkles;
            return (
              <SystemRow
                key={m.key}
                icon={<Icon className="h-4 w-4" />}
                title={m.label}
                subtitle={m.subtitle}
                cascade={m.cascade}
                enabled={sys[m.key]}
                onToggle={() => setSystem(m.key)}
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
  title,
  subtitle,
  cascade,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Lista de side-effects al togglear este módulo (audit F-09). */
  cascade?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  const cascadeMsg = cascade
    ? `Toggling ${title} ${enabled ? 'off' : 'on'} also affects: ${cascade}`
    : undefined;
  return (
    <div
      className={
        'flex items-center gap-2.5 rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
        aria-hidden
      >
        {icon}
      </span>
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
  onToggle,
  onLabel,
}: {
  entry: ModuleEntry;
  onToggle: () => void;
  onLabel: (label: string) => void;
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

  const Icon = MODULE_ICONS[entry.key] ?? Sparkles;

  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={dragControls}
      className={
        'group relative flex items-center gap-2.5 overflow-hidden rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (entry.enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
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
        <Icon className="h-4 w-4" />
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

      <ToggleSwitch enabled={entry.enabled} onChange={onToggle} label={entry.label} />
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Toggle                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ToggleSwitch({
  enabled,
  onChange,
  label,
  title,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  /** Tooltip nativo opcional — útil para comunicar cascadas (audit F-09). */
  title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Hide' : 'Show'} ${label}`}
      title={title}
      onClick={onChange}
      className={
        'relative flex h-6 w-10 shrink-0 items-center rounded-full transition ' +
        (enabled
          ? 'bg-sky-500/90 hover:bg-sky-500 dark:bg-sky-400/80 dark:hover:bg-sky-400'
          : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700')
      }
    >
      <span
        className={
          'flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition ' +
          (enabled ? 'translate-x-[18px]' : 'translate-x-0.5')
        }
      >
        {enabled ? (
          <Eye className="h-2.5 w-2.5 text-sky-600" />
        ) : (
          <EyeOff className="h-2.5 w-2.5 text-zinc-400" />
        )}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ListingModuleRow — fila de un Listing module dinámico con CRUD inline      */
/* ────────────────────────────────────────────────────────────────────────── */

function ListingModuleRow({
  icon,
  entry,
  itemCount,
  onToggle,
  onRename,
  onDuplicate,
  onDelete,
}: {
  icon: React.ReactNode;
  entry: ListingsCatalogEntry;
  itemCount: number;
  onToggle: () => void;
  onRename: (label: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.label);
  useEffect(() => setDraft(entry.label), [entry.label]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== entry.label) onRename(next);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-2 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 transition ${
          entry.enabled
            ? 'bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-400 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-600 dark:ring-zinc-700'
        }`}
      >
        {icon}
      </span>

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
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            /{entry.key}
          </code>{' '}
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

/* ────────────────────────────────────────────────────────────────────────── */
/* DeleteConfirm — modal inline para borrar un listing module                 */
/* ────────────────────────────────────────────────────────────────────────── */

function DeleteConfirm({
  label,
  itemCount,
  onCancel,
  onConfirm,
}: {
  label: string;
  itemCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="listing-module-delete"
      className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3"
    >
      <p
        id="listing-module-delete"
        className="text-[12.5px] font-medium text-red-700 dark:text-red-200"
      >
        Delete &quot;{label}&quot;?
      </p>
      <p className="mt-1 text-[11.5px] text-red-600/80 dark:text-red-300/80">
        {itemCount === 0
          ? 'The module is empty — safe to delete.'
          : `This will remove ${itemCount} listing${
              itemCount === 1 ? '' : 's'
            }, plus its subcategories and features. This cannot be undone.`}
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-red-500/20 px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition hover:bg-red-500/30 dark:text-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
