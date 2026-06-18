'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useModuleHeroBridge } from '@/components/home/use-module-hero-bridge';
import { useModuleLabel } from '@/components/i18n-provider';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { getCachedBrochures } from '@/components/studio-bridge';
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
    const apply = (detail: unknown) => {
      const d = detail as
        | {
            label?: string;
            heroImage?: string;
            categories?: string[];
            brochures?: BrochureItem[];
          }
        | undefined;
      if (!d || !Array.isArray(d.brochures)) return;
      setOverride({
        kind: 'digital-brochure',
        label: d.label ?? mod.label,
        heroImage: d.heroImage ?? mod.heroImage,
        categories: d.categories ?? mod.categories,
        brochures: d.brochures,
      });
    };
    // Hidrata desde el cache del bridge (edita→navega). No-op en runtime real.
    apply(getCachedBrochures());
    const handler = (e: Event) => apply((e as CustomEvent<unknown>).detail);
    window.addEventListener('kiosk:brochures-override', handler);
    return () => window.removeEventListener('kiosk:brochures-override', handler);
  }, [mod.label, mod.heroImage, mod.categories]);

  const effective = override ?? mod;

  // Empuja el hero efectivo al HomeHeader (preview live del Studio).
  useModuleHeroBridge(effective.heroImage);

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
