'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { PwaDashboardConfig, PwaQuickAccess, PwaTile } from '@/lib/config';
import { resolvePwaTileRoute } from '@/lib/pwa-routes';

import { ImageField } from '../../../_components/ImageField';

import { PwaField, PwaGroup, PwaLogoControls, PwaPanelHeader } from './pwa-ui';

/**
 * Editor de los módulos / navegación de la PWA: hero, accesos rápidos y tiles
 * del dashboard. La sección "Dashboard tiles" replica la UI del editor del
 * kiosk (drag&drop con grip, renombrar inline, botón Wide, toggle de
 * visibilidad) para que ambos editores sean consistentes — solo cambia el
 * contenido (los tiles de la PWA llevan imagen de fondo propia).
 */

const EMPTY_DASHBOARD: PwaDashboardConfig = {
  heroTitle: '',
  heroImage: '',
  quickAccess: [],
  tiles: [],
};

export function ModulesEditor({
  value,
  onChange,
  logo,
  onLogoChange,
}: {
  value: PwaDashboardConfig | undefined;
  onChange: (next: PwaDashboardConfig) => void;
  /** Logo del cliente (`branding.logo`) — editable aquí igual que en el kiosk. */
  logo?: string;
  onLogoChange?: (next: string | undefined) => void;
}) {
  const v: PwaDashboardConfig = {
    ...EMPTY_DASHBOARD,
    ...value,
    quickAccess: value?.quickAccess ?? [],
    tiles: value?.tiles ?? [],
  };

  const updateTile = (key: string, patch: Partial<PwaTile>) =>
    onChange({ ...v, tiles: v.tiles.map((t) => (t.key === key ? { ...t, ...patch } : t)) });

  const updateQuick = (i: number, patch: Partial<PwaQuickAccess>) =>
    onChange({
      ...v,
      quickAccess: v.quickAccess.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    });

  /**
   * Intercambia un acceso rápido con un tile del Dashboard: el módulo elegido
   * sube al slot de Quick Access y el que estaba ahí baja a Dashboard tiles, en
   * la misma posición que ocupaba el elegido (swap). Quick Access y Dashboard
   * tiles son un pool único y mutuamente excluyente.
   */
  const swapQuickAccess = (qaIndex: number, tileKey: string) => {
    const tileIndex = v.tiles.findIndex((t) => t.key === tileKey);
    if (tileIndex < 0) return;
    const tile = v.tiles[tileIndex];
    const old = v.quickAccess[qaIndex];
    const promoted: PwaQuickAccess = {
      key: tile.key,
      label: tile.label,
      image: tile.image,
      route: tile.route,
    };
    const demoted: PwaTile = {
      key: old.key,
      label: old.label,
      image: old.image,
      route: old.route,
      enabled: true,
    };
    onChange({
      ...v,
      quickAccess: v.quickAccess.map((q, idx) => (idx === qaIndex ? promoted : q)),
      tiles: v.tiles.map((t, idx) => (idx === tileIndex ? demoted : t)),
    });
  };

  const enabledCount = v.tiles.filter((t) => t.enabled !== false).length;

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Dashboard"
        description="Logo, hero, and the dashboard tiles / quick-access entries of the mobile app."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {onLogoChange ? (
          <PwaGroup title="Logo">
            <ImageField
              layout="compact"
              label="Client logo"
              hint="Header & login of the mobile app · SVG · PNG. Shared with the kiosk branding."
              value={logo}
              onChange={onLogoChange}
            />
            <PwaLogoControls
              size={v.logoSize}
              offset={v.logoOffset}
              onSizeChange={(logoSize) => onChange({ ...v, logoSize })}
              onOffsetChange={(logoOffset) => onChange({ ...v, logoOffset })}
            />
          </PwaGroup>
        ) : null}
        <PwaGroup title="Hero">
          <PwaField
            label="Hero title"
            multiline
            value={v.heroTitle}
            onChange={(t) => onChange({ ...v, heroTitle: t })}
          />
          <ImageField
            label="Hero image"
            hint="Background photo of the dashboard hero. JPG or PNG."
            layout="cover"
            aspect="390/200"
            value={v.heroImage}
            onChange={(next) => onChange({ ...v, heroImage: next ?? '' })}
          />
        </PwaGroup>

        {v.quickAccess.length > 0 ? (
          <section className="space-y-3">
            <header className="min-w-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Quick access
              </h3>
              <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
                Drag to reorder · pick a module · click to rename · set its image.
              </p>
              {/* F-PWA-11: el dashboard pinta exactamente 4 slots en posiciones
                  fijas (slice(0,4)). Con ≠4 sobran o faltan tiles en el grid. */}
              {v.quickAccess.length !== 4 ? (
                <p className="mt-1 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
                  The dashboard shows exactly 4 quick-access tiles — you have {v.quickAccess.length}
                  .{' '}
                  {v.quickAccess.length > 4
                    ? 'The extras past the fourth are ignored.'
                    : 'The empty slots stay blank.'}
                </p>
              ) : null}
            </header>
            <Reorder.Group
              axis="y"
              values={v.quickAccess}
              onReorder={(quickAccess) => onChange({ ...v, quickAccess })}
              className="flex flex-col gap-1.5"
            >
              {v.quickAccess.map((q, i) => {
                // Módulos elegibles = los tiles del Dashboard que no estén ya en
                // OTRO acceso rápido (los slots son mutuamente excluyentes).
                const usedByOthers = new Set(
                  v.quickAccess.filter((_, idx) => idx !== i).map((x) => x.key),
                );
                const options = v.tiles.filter((t) => !usedByOthers.has(t.key));
                return (
                  <PwaQuickAccessRow
                    key={`${q.key}-${i}`}
                    item={q}
                    options={options}
                    onSwap={(tileKey) => swapQuickAccess(i, tileKey)}
                    onLabel={(label) => updateQuick(i, { label })}
                    onImage={(image) => updateQuick(i, { image: image ?? '' })}
                  />
                );
              })}
            </Reorder.Group>
          </section>
        ) : null}

        {/* Opacidad de la capa oscura sobre la foto de los tiles. Global a
            todos por igual. Default 40 % (verbatim del XD). */}
        <PwaGroup title="Tiles">
          <div className="flex items-center gap-3">
            <label
              htmlFor="pwa-tile-overlay-opacity"
              className="shrink-0 text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300"
            >
              Tile overlay opacity
            </label>
            <input
              id="pwa-tile-overlay-opacity"
              type="range"
              min={0}
              max={100}
              step={1}
              value={v.tileOverlayOpacity ?? 40}
              onChange={(e) => onChange({ ...v, tileOverlayOpacity: Number(e.target.value) })}
              className="h-1.5 flex-1 cursor-pointer accent-sky-500"
            />
            <span className="w-12 shrink-0 text-right font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {v.tileOverlayOpacity ?? 40}%
            </span>
            {v.tileOverlayOpacity !== undefined && v.tileOverlayOpacity !== 40 ? (
              <button
                type="button"
                onClick={() => {
                  const next = { ...v };
                  delete next.tileOverlayOpacity;
                  onChange(next);
                }}
                title="Reset to default (40%)"
                className="shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-sky-500/30 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-sky-300"
              >
                Reset
              </button>
            ) : null}
          </div>
          {/* Tamaño de la tipografía del título de los tiles. Default 'S' = 15px
              (verbatim del XD); M/L/XL agrandan. Mismo look que el selector de
              tamaño del logo, para consistencia con el resto del editor PWA. */}
          <div>
            <span className="mb-1 block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
              Title size
            </span>
            <div
              role="radiogroup"
              aria-label="Tile title size"
              className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              {(['S', 'M', 'L', 'XL'] as const).map((s) => {
                const active = (v.tileTitleSize ?? 'S') === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange({ ...v, tileTitleSize: s })}
                    className={
                      'rounded-md px-3.5 py-1 text-[11.5px] font-semibold transition ' +
                      (active
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </PwaGroup>

        {/* Dashboard tiles — misma UI que el editor del kiosk (drag · rename ·
            Wide · visibilidad), con el ImageField del tile justo debajo. */}
        <section className="space-y-3">
          <header className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Dashboard tiles
              </h3>
              <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
                Drag to reorder · click to rename · toggle to hide from the grid.
              </p>
            </div>
            {v.tiles.length > 0 ? (
              <span className="shrink-0 whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-mono text-[10.5px] leading-tight text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                {enabledCount}/{v.tiles.length} on
              </span>
            ) : null}
          </header>

          {v.tiles.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
              No tiles configured for this client.
            </p>
          ) : (
            <Reorder.Group
              axis="y"
              values={v.tiles}
              onReorder={(tiles) => onChange({ ...v, tiles })}
              className="flex flex-col gap-1.5"
            >
              {v.tiles.map((t) => (
                <PwaTileRow
                  key={t.key}
                  tile={t}
                  onToggle={() => updateTile(t.key, { enabled: !(t.enabled !== false) })}
                  onLabel={(label) => updateTile(t.key, { label })}
                  onWide={(wide) => updateTile(t.key, { wide })}
                  onImage={(image) => updateTile(t.key, { image: image ?? '' })}
                />
              ))}
            </Reorder.Group>
          )}
        </section>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* PwaTileRow — réplica del ModuleRow del kiosk: grip + label inline + Wide +  */
/* toggle de visibilidad, con el ImageField del tile justo debajo.            */
/* ────────────────────────────────────────────────────────────────────────── */

function PwaTileRow({
  tile,
  onToggle,
  onLabel,
  onWide,
  onImage,
}: {
  tile: PwaTile;
  onToggle: () => void;
  onLabel: (label: string) => void;
  onWide: (wide: boolean) => void;
  onImage: (image: string | undefined) => void;
}) {
  const dragControls = useDragControls();
  const [editing, setEditing] = useState(false);
  const displayLabel = tile.label.replace(/\n/g, ' ');
  const [draft, setDraft] = useState(displayLabel);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const enabled = tile.enabled !== false;

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
      value={tile}
      dragListener={false}
      dragControls={dragControls}
      className={
        'group relative rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${displayLabel}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

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
            {resolvePwaTileRoute(tile) || '— (not navigable)'}
          </span>
        </div>

        {/* Full-width: el tile ocupa las 2 columnas del grid. */}
        <button
          type="button"
          onClick={() => onWide(!tile.wide)}
          aria-pressed={tile.wide ?? false}
          title={
            tile.wide
              ? 'Full width tile (spans 2 columns)'
              : 'Make this tile full width (2 columns)'
          }
          className={
            'shrink-0 rounded-md border px-1.5 py-1 text-[10px] font-semibold transition ' +
            ((tile.wide ?? false)
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:border-sky-400/40 dark:text-sky-300'
              : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500')
          }
        >
          Wide
        </button>

        <ToggleSwitch enabled={enabled} onChange={onToggle} label={displayLabel} />
      </div>

      {/* Imagen de fondo del tile (su contenido propio, ausente en el kiosk). */}
      <div className="mt-2 pl-[30px]">
        <ImageField
          layout="compact"
          label="Tile image"
          hint="Background photo · JPG · PNG"
          value={tile.image}
          onChange={onImage}
        />
      </div>
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Toggle de visibilidad — mismo look que el ToggleSwitch del editor kiosk.    */
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

/* ────────────────────────────────────────────────────────────────────────── */
/* PwaQuickAccessRow — misma fila que los Dashboard tiles (grip · rename ·     */
/* imagen) + un selector para cambiar este acceso rápido por otro módulo del  */
/* Dashboard. Se mantienen 4 (el hero del XD tiene 4 posiciones fijas).       */
/* ────────────────────────────────────────────────────────────────────────── */

function PwaQuickAccessRow({
  item,
  options,
  onSwap,
  onLabel,
  onImage,
}: {
  item: PwaQuickAccess;
  /** Tiles del Dashboard elegibles para intercambiar con este slot. */
  options: PwaTile[];
  /** Intercambia este acceso rápido con el tile `tileKey` (swap con Dashboard). */
  onSwap: (tileKey: string) => void;
  onLabel: (label: string) => void;
  onImage: (image: string | undefined) => void;
}) {
  const dragControls = useDragControls();
  const [editing, setEditing] = useState(false);
  const displayLabel = item.label.replace(/\n/g, ' ');
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
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="group relative block rounded-lg border border-zinc-200 bg-white p-2 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${displayLabel}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

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
            {resolvePwaTileRoute(item) || '— (not navigable)'}
          </span>
        </div>

        {/* Intercambiar este acceso rápido con un módulo del Dashboard: el
            elegido sube y el actual baja a Dashboard tiles (swap). */}
        <select
          value={item.key}
          onChange={(e) => {
            if (e.target.value !== item.key) onSwap(e.target.value);
          }}
          aria-label="Module"
          title="Swap this quick access with a Dashboard module"
          className="max-w-[120px] shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-[11px] font-medium text-zinc-700 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
        >
          {/* El módulo actual del slot (no está en `options` porque vive en QA). */}
          <option value={item.key}>{displayLabel}</option>
          {options.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label.replace(/\n/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Imagen del squircle del hero. */}
      <div className="mt-2 pl-[30px]">
        <ImageField
          layout="compact"
          label="Tile image"
          hint="Background photo · JPG · PNG"
          value={item.image}
          onChange={onImage}
        />
      </div>
    </Reorder.Item>
  );
}
