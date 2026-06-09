'use client';

import type { PwaDashboardConfig, PwaQuickAccess, PwaTile } from '@/lib/config';

import { ImageField } from '../../../_components/ImageField';

import {
  move,
  PwaField,
  PwaGroup,
  PwaLogoControls,
  PwaPanelHeader,
  ReorderButtons,
} from './pwa-ui';

/**
 * Editor de los módulos / navegación de la PWA: hero, accesos rápidos y tiles
 * del dashboard. v1 cubre las operaciones seguras (renombrar, reordenar,
 * ancho completo) que no rompen rutas. Añadir/eliminar tiles llega después
 * porque cambia la navegación config-driven (`resolvePwaTileRoute`).
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

  const updateTile = (i: number, patch: Partial<PwaTile>) =>
    onChange({ ...v, tiles: v.tiles.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });

  const updateQuick = (i: number, patch: Partial<PwaQuickAccess>) =>
    onChange({
      ...v,
      quickAccess: v.quickAccess.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    });

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
          <PwaGroup title="Quick access">
            {v.quickAccess.map((q, i) => (
              <div key={q.key} className="flex items-start gap-2">
                <ReorderButtons
                  index={i}
                  count={v.quickAccess.length}
                  onMove={(to) => onChange({ ...v, quickAccess: move(v.quickAccess, i, to) })}
                />
                <div className="flex-1">
                  <PwaField
                    label={q.key}
                    value={q.label}
                    onChange={(label) => updateQuick(i, { label })}
                  />
                </div>
              </div>
            ))}
          </PwaGroup>
        ) : null}

        <PwaGroup title="Dashboard tiles">
          {v.tiles.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
              No tiles configured for this client.
            </p>
          ) : (
            v.tiles.map((t, i) => (
              <div
                key={t.key}
                className="flex items-start gap-2 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800"
              >
                <ReorderButtons
                  index={i}
                  count={v.tiles.length}
                  onMove={(to) => onChange({ ...v, tiles: move(v.tiles, i, to) })}
                />
                <div className="flex-1 space-y-2">
                  <PwaField
                    label={t.key}
                    value={t.label}
                    onChange={(label) => updateTile(i, { label })}
                  />
                  <ImageField
                    layout="compact"
                    label="Tile image"
                    hint="Background photo · JPG · PNG"
                    value={t.image}
                    onChange={(image) => updateTile(i, { image: image ?? '' })}
                  />
                  <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={t.wide ?? false}
                      onChange={(e) => updateTile(i, { wide: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-700"
                    />
                    Full width tile
                  </label>
                </div>
              </div>
            ))
          )}
        </PwaGroup>
      </div>
    </div>
  );
}
