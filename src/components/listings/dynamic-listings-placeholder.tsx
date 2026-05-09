'use client';

import { useEffect, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { ListingsModule } from '@/components/listings/listings-module';
import { KIOSK_LISTINGS_OVERRIDE_EVENT, getCachedListings } from '@/components/studio-bridge';
import type { HomeModule, Listing } from '@/lib/config';

/**
 * Placeholder render para listing modules creados en el Studio que TODAVÍA
 * no existen en `config.features.home.modules.<key>` server-side. El preview
 * iframe carga con `KIOSK_CLIENT=default` (fs config), así que cuando el
 * operador agrega "Party" desde Modules tab y navega a `/home/party`, el SSR
 * no encuentra `mod` → cae aquí.
 *
 * El bridge dispatcha `kiosk:listings-override` con TODOS los listing modules
 * del KV (incluido Party). Escuchamos el evento, encontramos el entry con
 * `key === moduleKey` y construimos un `HomeModule` para alimentar al
 * `ListingsModule` componente normal.
 *
 * Si después de 1.5s no llega ningún override → mostrar "Module not found"
 * (ese caso aplica al kiosk runtime real, no al preview Studio).
 */
export function DynamicListingsPlaceholder({
  moduleKey,
  clientCoords,
}: {
  moduleKey: string;
  clientCoords?: { lat: number; lng: number };
}) {
  const [mod, setMod] = useState<HomeModule | null>(null);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(timeout);
  }, []);

  type ListingEntryShape = {
    key: string;
    label: string;
    enabled?: boolean;
    catalog?: {
      heroImage?: string;
      subcategories?: string[];
      features?: string[];
      listings?: Listing[];
    };
  };
  const findEntry = (detail: unknown): ListingEntryShape | null => {
    if (!Array.isArray(detail)) return null;
    return (
      (detail.find(
        (en): en is ListingEntryShape =>
          !!en && typeof en === 'object' && (en as { key?: string }).key === moduleKey,
      ) as ListingEntryShape | undefined) ?? null
    );
  };

  // Mount inicial: leer cache del bridge (evita race cuando el dispatch ya
  // pasó antes de que este componente montara — típico en navegación SPA).
  useEffect(() => {
    const cached = getCachedListings();
    const entry = findEntry(cached);
    if (entry?.catalog) {
      setMod({
        kind: 'listings',
        label: entry.label,
        heroImage: entry.catalog.heroImage ?? '',
        subcategories: entry.catalog.subcategories ?? [],
        features: entry.catalog.features ?? [],
        listings: entry.catalog.listings ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      const entry = findEntry(detail);
      if (!entry || !entry.catalog) return;
      setMod({
        kind: 'listings',
        label: entry.label,
        heroImage: entry.catalog.heroImage ?? '',
        subcategories: entry.catalog.subcategories ?? [],
        features: entry.catalog.features ?? [],
        listings: entry.catalog.listings ?? [],
      });
    };
    window.addEventListener(KIOSK_LISTINGS_OVERRIDE_EVENT, handler);
    return () => window.removeEventListener(KIOSK_LISTINGS_OVERRIDE_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  if (mod) {
    return (
      <ListingsModule
        moduleKey={moduleKey}
        module={mod}
        clientCoords={clientCoords}
        header={<MinimalHeader heroImage={mod.heroImage} />}
      />
    );
  }

  if (!waited) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div
          aria-hidden
          className="h-12 w-12 animate-spin rounded-full border-4"
          style={{
            borderColor: 'hsl(var(--brand-primary) / 0.2)',
            borderTopColor: 'hsl(var(--brand-primary))',
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-white px-10 text-center">
      <h1
        className="font-display font-bold uppercase"
        style={{ fontSize: '60px', letterSpacing: '0.02em', color: 'hsl(var(--brand-primary))' }}
      >
        {moduleKey}
      </h1>
      <p className="font-sans text-gray-600" style={{ fontSize: '24px' }}>
        Module not found.
      </p>
    </div>
  );
}

/**
 * Header minimal client-side: hero image + gradient + logo. Sin clock ni
 * weather (requieren server-side fetchWeather). Suficiente para preview de
 * listing modules dinámicos creados desde el Studio.
 */
function MinimalHeader({ heroImage }: { heroImage?: string }) {
  return (
    <header
      className="relative overflow-hidden"
      style={{ width: '1080px', height: '620px', flexShrink: 0 }}
    >
      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsl(var(--brand-primary) / 0.9) 0%, hsl(var(--brand-primary) / 0.55) 30%, hsl(var(--brand-primary) / 0) 70%)',
        }}
      />
      <div
        className="absolute flex items-center"
        style={{ left: '65px', top: '38px', width: '360px', height: '90px' }}
      >
        <TrueOmniLogo slot="default" className="h-full w-full text-white" />
      </div>
    </header>
  );
}
