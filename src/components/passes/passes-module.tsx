'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import type { HomeListing, HomePassesModule } from '@/lib/config';

import { PassesGrid } from './passes-grid';
import { PassesToolbar } from './passes-toolbar';

interface Props {
  moduleKey: string;
  module: HomePassesModule;
  textos: Record<string, string>;
  header: ReactNode;
}

export function PassesModule({ moduleKey, module: mod, textos, header }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  const searchPool: HomeListing[] = useMemo(
    () =>
      mod.passes.map((p) => ({
        slug: p.slug,
        title: p.title,
        category: moduleKey,
        image: p.cover,
      })),
    [mod.passes, moduleKey],
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      {header}
      <PassesToolbar
        label={mod.label}
        onSearchOpen={() => setSearchOpen(true)}
        searchAriaLabel={textos.passes_label ?? 'Passes'}
      />
      <main
        className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingTop: '40px', paddingBottom: '140px' }}
      >
        <PassesGrid passes={mod.passes} />
      </main>
      <FloatingHomeButton />
      {searchOpen ? (
        <SearchOverlay listings={searchPool} onClose={() => setSearchOpen(false)} />
      ) : null}
    </div>
  );
}
