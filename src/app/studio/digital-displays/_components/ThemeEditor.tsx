'use client';

import {
  ChevronLeft,
  ExternalLink,
  History,
  Languages,
  LayoutPanelTop,
  Monitor,
  Palette,
  Send,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { SignageDisplayListEntry } from '@/lib/signage/config';
import type { SignageClientResolved } from '@/lib/signage/schema';

import { StudioPageHeader } from '../../_components/PageHeader';

import { BrandingTab } from './tabs/BrandingTab';
import { DisplaysTab } from './tabs/DisplaysTab';
import { HeaderTab } from './tabs/HeaderTab';
import { I18nTab } from './tabs/I18nTab';
import { PublishTab } from './tabs/PublishTab';
import { VersionsTab } from './tabs/VersionsTab';

/**
 * `<ThemeEditor>` — Editor del signage theme con tabs (DSS1).
 *
 * Client component que orquesta:
 *  - `<StudioPageHeader>` del shell.
 *  - Breadcrumb de vuelta al dashboard.
 *  - Hero con name + slug + botón Preview (abre primer display en nueva tab).
 *  - Sidebar vertical de tabs (Branding · Header · Displays · Versions · Publish).
 *  - Content area que cambia según el tab activo.
 *
 * **DSS1 es read-only.** Los tabs muestran configuración fs sin permitir
 * edición. Los formularios editables aterrizan en DSS5+ (Branding, Header,
 * Module editors), DSS6 (Versions), DSS7 (Publish).
 */
export interface ThemeEditorProps {
  client: SignageClientResolved;
  displays: SignageDisplayListEntry[];
  tokensCss: string;
}

type TabId = 'branding' | 'header' | 'displays' | 'i18n' | 'versions' | 'publish';

interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  comingSoon?: string;
}

const TABS: readonly TabDef[] = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'header', label: 'Header', icon: LayoutPanelTop },
  { id: 'displays', label: 'Displays', icon: Monitor },
  { id: 'i18n', label: 'i18n', icon: Languages },
  { id: 'versions', label: 'Versions', icon: History },
  { id: 'publish', label: 'Publish', icon: Send },
] as const;

export function ThemeEditor({ client, displays, tokensCss }: ThemeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('branding');
  const firstDisplay = displays[0];
  const previewHref = firstDisplay
    ? `/signage/${client.slug}/${firstDisplay.slug}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      {/* Breadcrumb */}
      <Link
        href="/studio/digital-displays"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        All signage themes
      </Link>

      {/* Hero */}
      <section className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
            Signage theme
          </p>
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            {client.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[12px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {client.slug}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span>
              {displays.length} display{displays.length === 1 ? '' : 's'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span>
              {client.locale.toUpperCase()} · {client.timezone}
            </span>
          </p>
        </div>
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            Preview {firstDisplay?.slug}
          </a>
        ) : null}
      </section>

      {/* Read-only banner */}
      <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-semibold">Editor read-only en DSS1</p>
        <p className="mt-1 text-amber-800 dark:text-amber-300/90">
          La estructura de tabs ya está aquí. Los formularios editables (Branding,
          Header, módulos, playlist) aterrizan en DSS5+. Versions y Publish quedan
          bloqueados hasta DSS6/DSS7.
        </p>
      </section>

      {/* Sidebar + content */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label="Theme editor sections"
          className="flex flex-row gap-1.5 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-2 lg:flex-col lg:overflow-x-visible dark:border-zinc-800 dark:bg-zinc-950"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const baseClass =
              'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition';
            const activeClass = isActive
              ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white'
              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100';
            const disabledClass =
              'cursor-not-allowed text-zinc-400 dark:text-zinc-600';
            return (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                title={tab.comingSoon ? `Coming in ${tab.comingSoon}` : undefined}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                className={`${baseClass} ${
                  tab.disabled ? disabledClass : activeClass
                } whitespace-nowrap`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
                  }`}
                  strokeWidth={1.75}
                />
                <span className="flex-1">{tab.label}</span>
                {tab.comingSoon ? (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
                    {tab.comingSoon}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          {activeTab === 'branding' ? (
            <BrandingTab client={client} tokensCss={tokensCss} />
          ) : null}
          {activeTab === 'header' ? <HeaderTab client={client} /> : null}
          {activeTab === 'displays' ? (
            <DisplaysTab clientSlug={client.slug} displays={displays} />
          ) : null}
          {activeTab === 'i18n' ? (
            <I18nTab clientSlug={client.slug} defaultLocale={client.locale} />
          ) : null}
          {activeTab === 'versions' ? <VersionsTab /> : null}
          {activeTab === 'publish' ? <PublishTab /> : null}
        </div>
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Digital Displays · Studio v0.1</span>
        <span>Local · main</span>
      </footer>
    </main>
  );
}
