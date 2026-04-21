'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { filterBrochures } from '@/lib/brochures-filter';
import type { HomeDigitalBrochureModule } from '@/lib/config';

import { BrochuresHeader } from './brochures-header';
import { BrochuresList } from './brochures-list';
import { BrochuresSearchOverlay } from './brochures-search-overlay';
import { BrochuresTabs } from './brochures-tabs';

export function BrochuresModule({
  moduleKey,
  module: mod,
  header,
}: {
  moduleKey: string;
  module: HomeDigitalBrochureModule;
  header: ReactNode;
}) {
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [searchOpen, setSearchOpen] = useState(false);

  const visible = useMemo(
    () => filterBrochures(mod.brochures, { category: activeCategory }),
    [mod.brochures, activeCategory],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {header}
      <BrochuresHeader label={mod.label} onSearch={() => setSearchOpen(true)} />
      <BrochuresTabs
        categories={mod.categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <BrochuresList brochures={visible} moduleKey={moduleKey} />
      </main>

      {/* Scroll-hint bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: '110px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 75%, #fff 100%)',
        }}
      />

      <FloatingHomeButton />

      <BrochuresSearchOverlay
        open={searchOpen}
        moduleKey={moduleKey}
        brochures={mod.brochures}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
