'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Camera,
  ClipboardList,
  Compass,
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
  RotateCcw,
  Share2,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_SYSTEM_MODULES,
  MODULE_KEY_TO_SYSTEM_FIELD,
  defaultModules,
  type ModuleEntry,
  type ModulesConfig,
  type SystemModules,
} from '@/lib/studio/schema';

/* ────────────────────────────────────────────────────────────────────────── */
/* Iconos Lucide por module key — reemplazan los emojis del primer iter.      */
/* ────────────────────────────────────────────────────────────────────────── */

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
 * Módulos "tipo listing" — tienen catálogos grandes (items con imágenes,
 * subcategorías, features). Restaurants / Things to Do / Stay / Events
 * comparten el patrón ListingsModule del kiosk runtime.
 */
const LISTING_MODULE_LIST: Array<{ key: keyof SystemModules; tileKey: string; label: string; subtitle: string }> = [
  { key: 'restaurants', tileKey: 'restaurants', label: 'Restaurants', subtitle: 'Food & Drink listings' },
  { key: 'thingsToDo', tileKey: 'things-to-do', label: 'Things to Do', subtitle: 'Activities & attractions' },
  { key: 'stay', tileKey: 'stay', label: 'Stay', subtitle: 'Hotels & lodging' },
  { key: 'events', tileKey: 'events', label: 'Events', subtitle: 'Calendar of events' },
];

const HOME_MODULE_LIST: Array<{ key: keyof SystemModules; tileKey: string; label: string; subtitle: string }> = [
  { key: 'itineraryBuilder', tileKey: 'itinerary-builder', label: 'Itinerary Builder', subtitle: 'AI-assisted trip planner' },
  { key: 'passes', tileKey: 'passes', label: 'Passes', subtitle: 'Multi-attraction passes' },
  { key: 'tickets', tileKey: 'tickets', label: 'Tickets', subtitle: 'Single-attraction tickets' },
  { key: 'guestbook', tileKey: 'guestbook', label: 'Guestbook', subtitle: 'Visitor pins on the map' },
  { key: 'socialWall', tileKey: 'social-wall', label: 'Social Wall', subtitle: 'Curated social feed' },
  { key: 'digitalBrochure', tileKey: 'digital-brochure', label: 'Digital Brochure', subtitle: 'Flippable brochures' },
  { key: 'map', tileKey: 'map', label: 'Map', subtitle: 'Interactive POI map' },
  { key: 'survey', tileKey: 'survey', label: 'Survey', subtitle: 'NPS / feedback overlay' },
  { key: 'deals', tileKey: 'deals', label: 'Deals', subtitle: 'Promotions & discounts' },
  { key: 'photoBooth', tileKey: 'photo-booth', label: 'Photo Booth', subtitle: 'Green-screen capture' },
  { key: 'trails', tileKey: 'trails', label: 'Trails', subtitle: 'Hiking / walking trails' },
  { key: 'wayfinding', tileKey: 'wayfinding', label: 'Wayfinding', subtitle: 'On-property navigation' },
];

const GLOBAL_MODULE_LIST: Array<{ key: keyof SystemModules; icon: LucideIcon; label: string; subtitle: string }> = [
  { key: 'ads', icon: Megaphone, label: 'Ads', subtitle: 'Hero, bottom banner, popup interstitial' },
  { key: 'languages', icon: Languages, label: 'Languages', subtitle: 'Locale picker on the Billboard' },
  { key: 'aiAvatar', icon: Sparkles, label: 'AI Avatar', subtitle: 'Floating Ask Anything bubble' },
];

export function SystemModulesEditor({
  modules,
  onChange,
}: {
  modules: ModulesConfig;
  onChange: (next: ModulesConfig) => void;
}) {
  const sys: SystemModules = modules.systemModules ?? DEFAULT_SYSTEM_MODULES;
  const allKeys = [
    ...LISTING_MODULE_LIST.map((m) => m.key),
    ...HOME_MODULE_LIST.map((m) => m.key),
    ...GLOBAL_MODULE_LIST.map((m) => m.key),
  ];
  const enabledCount = allKeys.filter((k) => sys[k]).length;
  const totalCount = allKeys.length;

  const setSystem = (k: keyof SystemModules) =>
    onChange({ ...modules, systemModules: { ...sys, [k]: !sys[k] } });

  const handleReset = () =>
    onChange({ ...modules, systemModules: { ...DEFAULT_SYSTEM_MODULES } });

  return (
    <div className="space-y-7">
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Listing modules
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Catalog-style modules with item lists, subcategories and filters.
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
          {LISTING_MODULE_LIST.map((m) => {
            const Icon = MODULE_ICONS[m.tileKey] ?? Sparkles;
            return (
              <SystemRow
                key={m.key}
                icon={<Icon className="h-4 w-4" />}
                title={m.label}
                subtitle={m.subtitle}
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
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
}) {
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
      </div>
      <ToggleSwitch enabled={enabled} onChange={onToggle} label={title} />
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
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Hide' : 'Show'} ${label}`}
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
