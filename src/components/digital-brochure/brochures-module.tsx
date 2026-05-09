'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useModuleLabel } from '@/components/i18n-provider';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { filterBrochures } from '@/lib/brochures-filter';
import type { BrochureItem, HomeDigitalBrochureModule } from '@/lib/config';

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
  const moduleLabel = useModuleLabel(moduleKey, mod.label);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [searchOpen, setSearchOpen] = useState(false);

  // Live override desde el Studio (S3.4).
  const [override, setOverride] = useState<HomeDigitalBrochureModule | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          label?: string;
          heroImage?: string;
          categories?: string[];
          brochures?: BrochureItem[];
        }>
      ).detail;
      if (!detail || !Array.isArray(detail.brochures)) return;
      setOverride({
        kind: 'digital-brochure',
        label: detail.label ?? mod.label,
        heroImage: detail.heroImage ?? mod.heroImage,
        categories: detail.categories ?? mod.categories,
        brochures: detail.brochures,
      });
    };
    window.addEventListener('kiosk:brochures-override', handler);
    return () => window.removeEventListener('kiosk:brochures-override', handler);
  }, [mod.label, mod.heroImage, mod.categories]);

  const effective = override ?? mod;

  // Si la categoría activa ya no existe en el override, vuelve a "all".
  useEffect(() => {
    if (activeCategory !== 'all' && !effective.categories.includes(activeCategory as string)) {
      setActiveCategory('all');
    }
  }, [effective.categories, activeCategory]);

  const visible = useMemo(
    () => filterBrochures(effective.brochures, { category: activeCategory }),
    [effective.brochures, activeCategory],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {header}
      <BrochuresHeader label={moduleLabel} onSearch={() => setSearchOpen(true)} />
      <BrochuresTabs
        categories={effective.categories}
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
        brochures={effective.brochures}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
