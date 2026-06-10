'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  History,
  Languages,
  LayoutPanelTop,
  Monitor,
  Newspaper,
  Palette,
  RotateCcw,
  Send,
  Share2,
  type LucideIcon,
} from 'lucide-react';

import type { BridgeStatus } from '@/lib/bridge/types';

import { useRovingTabList } from '../../../_lib/use-roving-tab-list';

/**
 * `<SignageSidebarTabs>` — sidebar vertical del editor signage.
 *
 * Mismo lenguaje visual que `<SidebarTabs>` del kiosk: tablist a-11y con
 * arrow keys, layoutId active indicator (framer-motion), icon badge sky,
 * bridge status footer + Diagnostics link.
 *
 * Generic: acepta `sections` como prop para reuso en ThemeEditor (6 tabs)
 * y DisplayEditor (4 tabs). Cada section debe ser shape-compatible con
 * `SignageSection`.
 */
export interface SignageSection<K extends string = string> {
  key: K;
  label: string;
  title: string;
  icon: LucideIcon;
}

// Sections del theme editor (default export para retro-compat).
export type SignageSectionKey =
  | 'branding'
  | 'header'
  | 'displays'
  | 'events'
  | 'social'
  | 'news'
  | 'i18n'
  | 'versions'
  | 'publish';

export const SIGNAGE_SECTIONS: readonly SignageSection<SignageSectionKey>[] = [
  {
    key: 'branding',
    label: 'Branding',
    title: 'Brand colors, logos, fonts',
    icon: Palette,
  },
  {
    key: 'header',
    label: 'Header',
    title: 'Header position, weather, clock',
    icon: LayoutPanelTop,
  },
  {
    key: 'displays',
    label: 'Displays',
    title: 'Manage displays in this theme',
    icon: Monitor,
  },
  {
    key: 'events',
    label: 'Events',
    title: 'Events shown across the theme',
    icon: CalendarDays,
  },
  {
    key: 'social',
    label: 'Social',
    title: 'Social posts and featured tweet',
    icon: Share2,
  },
  {
    key: 'news',
    label: 'News',
    title: 'News source and items',
    icon: Newspaper,
  },
  {
    key: 'i18n',
    label: 'Languages',
    title: 'i18n bag editor',
    icon: Languages,
  },
  {
    key: 'versions',
    label: 'Versions',
    title: 'Snapshots and restore',
    icon: History,
  },
  {
    key: 'publish',
    label: 'Publish',
    title: 'Open PR with current state',
    icon: Send,
  },
] as const;

export interface SignageSidebarTabsProps<K extends string = string> {
  sections?: ReadonlyArray<SignageSection<K>>;
  activeKey: K;
  onSelect: (key: K) => void;
  ariaLabel?: string;
  bridgeStatus: BridgeStatus;
  onReloadPreview?: () => void;
}

export function SignageSidebarTabs<K extends string = string>({
  sections,
  activeKey,
  onSelect,
  ariaLabel = 'Signage editor sections',
  bridgeStatus,
  onReloadPreview,
}: SignageSidebarTabsProps<K>) {
  const items = (sections ??
    (SIGNAGE_SECTIONS as unknown as ReadonlyArray<SignageSection<K>>)) as ReadonlyArray<
    SignageSection<K>
  >;
  const { buttonRefs, handleKeyDown } = useRovingTabList({
    count: items.length,
    onSelect: (idx) => {
      const section = items[idx];
      if (section) onSelect(section.key);
    },
  });

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:w-[var(--studio-sidebar-w)]">
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label={ariaLabel}
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
      >
        {items.map((section, idx) => {
          const Icon = section.icon;
          const isActive = activeKey === section.key;
          return (
            <button
              key={section.key}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`signage-panel-${section.key}`}
              id={`signage-tab-${section.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(section.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              title={section.title}
              className={
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ' +
                (isActive ? '' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60')
              }
              data-active={isActive}
            >
              {isActive ? (
                <motion.span
                  layoutId="signage-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-md transition-colors ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-600 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300'
                    : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
              </span>
              <span
                className={`relative flex flex-1 leading-tight ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200'
                }`}
              >
                <span className="font-medium">{section.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <BridgeStatusCard status={bridgeStatus} onReload={onReloadPreview} />
    </aside>
  );
}

function BridgeStatusCard({ status, onReload }: { status: BridgeStatus; onReload?: () => void }) {
  const presets = {
    connecting: {
      dot: 'bg-sky-500 animate-pulse',
      label: 'Connecting…',
      tone: 'text-sky-600 dark:text-sky-300',
      sub: 'Waiting for display handshake.',
    },
    connected: {
      dot: 'bg-emerald-500',
      label: 'Live preview connected',
      tone: 'text-emerald-600 dark:text-emerald-300',
      sub: 'Edits push to the iframe in <120 ms via postMessage.',
    },
    stale: {
      dot: 'bg-amber-500 animate-pulse',
      label: 'Preview stale',
      tone: 'text-amber-600 dark:text-amber-300',
      sub: 'No heartbeat in 5–30 s. The iframe may be paused.',
    },
    lost: {
      dot: 'bg-red-500',
      label: 'Bridge disconnected',
      tone: 'text-red-600 dark:text-red-400',
      sub: 'No heartbeat for 30 s+. Reload the preview.',
    },
  } as const;
  const p = presets[status];
  const showReload = status === 'stale' || status === 'lost';

  return (
    <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-900">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/50">
        <div className={`mb-1 flex items-center gap-1.5 text-[11px] ${p.tone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
          <span>{p.label}</span>
        </div>
        <p
          className="truncate text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500"
          title={p.sub}
        >
          {p.sub}
        </p>
        {showReload && onReload ? (
          <button
            type="button"
            onClick={onReload}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <RotateCcw className="h-3 w-3" />
            Reload preview
          </button>
        ) : null}
      </div>
      <a
        href="/studio/digital-displays/diagnostics"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-4 w-4 place-items-center rounded bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          Diagnostics
        </span>
        <span className="text-zinc-400 dark:text-zinc-600" aria-hidden>
          ↗
        </span>
      </a>
    </div>
  );
}
