'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useNotifications } from '@/hooks/use-notifications';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaNotification, PwaNotificationsConfig } from '@/lib/config';
import { timeAgo } from '@/lib/social-date';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaAlertModal } from './pwa-alert-modal';
import { PwaSubHeader } from './pwa-sub-header';

const PWA = 'hsl(var(--pwa-primary))';
const FAVORITE = 'hsl(var(--pwa-favorite))';
const OPEN_SANS = 'var(--font-open-sans)';

/** Token de acento por tipo (white-label). Se usa con alpha para el fondo. */
const ACCENT_VAR: Record<PwaNotification['type'], string> = {
  event: 'var(--pwa-primary)',
  deal: 'var(--brand-tertiary)',
  alert: 'var(--pwa-favorite)',
  info: 'var(--brand-secondary)',
};

/** Glyph por tipo (Font Awesome 6, fill currentColor). */
const TYPE_ICON: Record<PwaNotification['type'], string> = {
  event:
    'M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192z',
  deal: 'M0 80V229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176c-12-12-28.3-18.7-45.3-18.7H48C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z',
  info: 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm-40-176h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z',
  alert:
    'M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z',
};

function TypeAvatar({ type }: { type: PwaNotification['type'] }) {
  const v = ACCENT_VAR[type];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: 52, height: 52, backgroundColor: `hsl(${v} / 0.14)` }}
    >
      <svg width={24} height={24} viewBox="0 0 512 512" fill={`hsl(${v})`} aria-hidden>
        <path d={TYPE_ICON[type]} />
      </svg>
    </span>
  );
}

/** Círculo de selección estilo iOS (lleno azul con check, o borde gris). */
function SelectCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: 22,
        height: 22,
        backgroundColor: checked ? PWA : 'transparent',
        border: checked ? 'none' : '1.5px solid hsl(var(--foreground) / 0.3)',
      }}
    >
      {checked && (
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 6 9 17l-5-5"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * Notifications (`/pwa/notifications`) — lista. Header 90px (chevron + acción Delete),
 * filtro All/Unread + "Mark all read", filas con dot de no-leído / acento por tipo y
 * time-ago. Modo selección (checkbox + Select All + Delete(n) → confirm). Empty state.
 * Estado read/deleted vía `useNotifications` (localStorage). Tap en fila → detalle.
 */
export function NotificationsScreen({
  cfg,
  seed,
}: {
  cfg: PwaNotificationsConfig;
  seed: PwaNotification[];
}) {
  const router = useRouter();
  const { items, unreadCount, mounted, markRead, markAllRead, deleteIds } = useNotifications(seed);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter],
  );

  const exitSelection = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = visible.length > 0 && visible.every((n) => selected.has(n.id));
  const toggleSelectAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((n) => n.id)));

  const onRow = (id: string) => {
    if (selectionMode) {
      toggleSelect(id);
      return;
    }
    markRead(id);
    router.push(`/pwa/notifications/${id}`);
  };

  const empty = items.length === 0;

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado, 90px) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader
            title={cfg.title}
            backHref="/pwa/dashboard"
            right={
              empty ? undefined : selectionMode ? (
                <button
                  type="button"
                  onClick={exitSelection}
                  style={{ fontSize: 16, fontFamily: OPEN_SANS }}
                >
                  {cfg.cancel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectionMode(true)}
                  style={{ fontSize: 16, fontFamily: OPEN_SANS }}
                >
                  {cfg.delete}
                </button>
              )
            }
          />
        </div>
      </div>

      {/* Cuerpo */}
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
          <svg
            width={72}
            height={64}
            viewBox="0 0 576 512"
            fill="hsl(var(--foreground) / 0.15)"
            aria-hidden
          >
            <path d="M64 80c-8.8 0-16 7.2-16 16V288h95.6c19.3 0 36.9 10.8 45.6 28l9.7 19.4c2.7 5.4 8.2 8.8 14.3 8.8H358.3c6.1 0 11.6-3.4 14.3-8.8l9.7-19.4c8.6-17.2 26.3-28 45.6-28H528V96c0-8.8-7.2-16-16-16H64zM528 336H431.6L421.9 355.4c-13.5 27.1-41.2 44.6-71.5 44.6H225.6c-30.3 0-58-17.4-71.5-44.6L144.4 336H48V416c0 8.8 7.2 16 16 16H512c8.8 0 16-7.2 16-16V336zM0 96C0 60.7 28.7 32 64 32H512c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96z" />
          </svg>
          <h2
            className="mt-4 font-bold text-foreground"
            style={{ fontSize: 18, fontFamily: OPEN_SANS }}
          >
            {cfg.emptyTitle}
          </h2>
          <p className="mt-1 text-foreground/50" style={{ fontSize: 14, fontFamily: OPEN_SANS }}>
            {cfg.emptyBody}
          </p>
        </div>
      ) : (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
          {/* Filtro + Mark all read (oculto en modo selección) */}
          {!selectionMode && (
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <div className="flex gap-2">
                {(['all', 'unread'] as const).map((f) => {
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className="rounded-full px-3.5 py-1.5 font-semibold"
                      style={{
                        fontSize: 13,
                        fontFamily: OPEN_SANS,
                        backgroundColor: active ? PWA : 'hsl(var(--foreground) / 0.06)',
                        color: active ? '#fff' : 'hsl(var(--foreground) / 0.6)',
                      }}
                    >
                      {f === 'all' ? cfg.filterAll : cfg.filterUnread}
                    </button>
                  );
                })}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="font-semibold"
                  style={{ fontSize: 13, color: PWA, fontFamily: OPEN_SANS }}
                >
                  {cfg.markAllRead}
                </button>
              )}
            </div>
          )}

          <ul className={selectionMode ? '' : 'pt-1'}>
            {visible.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onRow(n.id)}
                  className="flex w-full items-center gap-3 border-b px-4 py-3 text-left"
                  style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
                >
                  {/* Indicador izquierdo: checkbox (selección) o dot de no-leído */}
                  <span className="flex w-[22px] shrink-0 items-center justify-center">
                    {selectionMode ? (
                      <SelectCircle checked={selected.has(n.id)} />
                    ) : !n.read ? (
                      <span
                        className="rounded-full"
                        style={{ width: 9, height: 9, backgroundColor: PWA }}
                      />
                    ) : null}
                  </span>

                  {/* Avatar: imagen o acento por tipo */}
                  {n.image ? (
                    <span
                      className="shrink-0 rounded-[10px] bg-cover bg-center"
                      style={{
                        width: 52,
                        height: 52,
                        backgroundImage: `url("${resolveAssetUrl(n.image)}")`,
                      }}
                    />
                  ) : (
                    <TypeAvatar type={n.type} />
                  )}

                  {/* Contenido */}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate text-foreground"
                        style={{
                          fontSize: 15,
                          fontWeight: n.read ? 500 : 700,
                          fontFamily: OPEN_SANS,
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        className="shrink-0 text-foreground/40"
                        style={{ fontSize: 11.5, fontFamily: OPEN_SANS }}
                      >
                        {mounted ? timeAgo(n.timestamp) : ''}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 line-clamp-2 block text-foreground/55"
                      style={{ fontSize: 13, lineHeight: 1.35, fontFamily: OPEN_SANS }}
                    >
                      {n.body}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Barra de selección */}
      {selectionMode && (
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid hsl(var(--foreground) / 0.1)' }}
        >
          <button
            type="button"
            onClick={toggleSelectAll}
            className="font-semibold"
            style={{ fontSize: 14, color: PWA, fontFamily: OPEN_SANS }}
          >
            {cfg.selectAll}
          </button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => setConfirmOpen(true)}
            className="rounded-full px-5 font-bold text-white disabled:opacity-40"
            style={{ height: 40, backgroundColor: FAVORITE, fontSize: 14, fontFamily: OPEN_SANS }}
          >
            {cfg.deleteSelected.replace('{count}', String(selected.size))}
          </button>
        </div>
      )}

      <PwaBottomNav />

      <PwaAlertModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={cfg.confirmTitle}
        body={cfg.confirmBody}
        primaryCta={cfg.confirmDelete}
        onPrimary={() => {
          deleteIds([...selected]);
          setConfirmOpen(false);
          exitSelection();
        }}
        secondaryCta={cfg.confirmCancel}
        onSecondary={() => setConfirmOpen(false)}
      />
    </div>
  );
}
