'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleLabel, useTextosMap } from '@/components/i18n-provider';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import type { HomeListing, HomePassesModule, PassItem } from '@/lib/config';

import { PassesGrid } from './passes-grid';
import { PassesToolbar } from './passes-toolbar';

interface Props {
  moduleKey: string;
  module: HomePassesModule;
  header: ReactNode;
}

export function PassesModule({ moduleKey, module: mod, header }: Props) {
  const textos = useTextosMap();

  // Live preview override del Studio (S3.7).
  const [override, setOverride] = useState<HomePassesModule | null>(null);
  const effective: HomePassesModule = override ?? mod;
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          label?: string;
          heroImage?: string;
          passes?: PassItem[];
          qrLogo?: string;
        }>
      ).detail;
      if (!detail || !Array.isArray(detail.passes)) return;
      setOverride({
        kind: 'passes',
        label: detail.label ?? mod.label,
        heroImage: detail.heroImage ?? mod.heroImage,
        passes: detail.passes,
        qrLogo: detail.qrLogo ?? mod.qrLogo,
      });
    };
    window.addEventListener('kiosk:passes-override', handler);
    return () => window.removeEventListener('kiosk:passes-override', handler);
  }, [mod.label, mod.heroImage, mod.qrLogo]);

  const moduleLabel = useModuleLabel(moduleKey, effective.label);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchPool: HomeListing[] = useMemo(
    () =>
      effective.passes.map((p) => ({
        slug: p.slug,
        title: p.title,
        category: moduleKey,
        image: p.cover,
      })),
    [effective.passes, moduleKey],
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      {header}
      <PassesToolbar
        label={moduleLabel}
        onSearchOpen={() => setSearchOpen(true)}
        searchAriaLabel={textos.passes_label ?? 'Passes'}
      />
      <main
        className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingTop: '40px', paddingBottom: '140px' }}
      >
        <PassesGrid passes={effective.passes} emptyLabel={textos.passes_empty} />
      </main>
      {/* Scroll-hint gradient: fade blanco→transparente de abajo arriba, pegado al bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: '140px',
          background: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0) 100%)',
          zIndex: 10,
        }}
      />
      <FloatingHomeButton />
      {searchOpen ? (
        <SearchOverlay listings={searchPool} onClose={() => setSearchOpen(false)} />
      ) : null}
    </div>
  );
}
