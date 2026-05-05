'use client';

import { useEffect, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { ListingDetail } from '@/components/listings/listing-detail';
import { ListingsModule } from '@/components/listings/listings-module';
import {
  KIOSK_LISTINGS_OVERRIDE_EVENT,
  getCachedListings,
} from '@/components/studio-bridge';
import type { HomeModule, Listing } from '@/lib/config';

/**
 * Detail screen para listing modules creados en el Studio que aún no están
 * publicados al fs (`/home/<dyn-module>/<slug>`). Reusa la misma lógica del
 * `DynamicListingsPlaceholder` para encontrar el module entry vía bridge,
 * luego encuentra el listing por slug y renderea ListingDetail encima del
 * ListingsModule background.
 */
export function DynamicListingDetailPlaceholder({
  moduleKey,
  slug,
  mapboxToken,
  clientCoords,
}: {
  moduleKey: string;
  slug: string;
  mapboxToken?: string;
  clientCoords?: { lat: number; lng: number };
}) {
  const [mod, setMod] = useState<HomeModule | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(timeout);
  }, []);

  type ListingEntryShape = {
    key: string;
    label: string;
    catalog?: {
      heroImage?: string;
      subcategories?: string[];
      features?: string[];
      listings?: Listing[];
    };
  };

  const hydrate = (detail: unknown) => {
    if (!Array.isArray(detail)) return;
    const entry = detail.find(
      (en): en is ListingEntryShape =>
        !!en && typeof en === 'object' && (en as { key?: string }).key === moduleKey,
    ) as ListingEntryShape | undefined;
    if (!entry?.catalog) return;
    const m: HomeModule = {
      kind: 'listings',
      label: entry.label,
      heroImage: entry.catalog.heroImage ?? '',
      subcategories: entry.catalog.subcategories ?? [],
      features: entry.catalog.features ?? [],
      listings: entry.catalog.listings ?? [],
    };
    setMod(m);
    const item = m.listings.find((l) => l.slug === slug) ?? null;
    setListing(item);
  };

  // Mount: lee cache del bridge.
  useEffect(() => {
    hydrate(getCachedListings());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, slug]);

  useEffect(() => {
    const handler = (e: Event) => {
      hydrate((e as CustomEvent<unknown>).detail);
    };
    window.addEventListener(KIOSK_LISTINGS_OVERRIDE_EVENT, handler);
    return () => window.removeEventListener(KIOSK_LISTINGS_OVERRIDE_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, slug]);

  if (mod && listing) {
    return (
      <>
        <ListingsModule
          moduleKey={moduleKey}
          module={mod}
          clientCoords={clientCoords}
          header={<MinimalHeader heroImage={mod.heroImage} />}
        />
        <ListingDetail
          moduleKey={moduleKey}
          listing={listing}
          mapboxToken={mapboxToken}
          clientCoords={clientCoords}
        />
      </>
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
        style={{ fontSize: '60px', color: 'hsl(var(--brand-primary))' }}
      >
        {moduleKey}
      </h1>
      <p className="font-sans text-gray-600" style={{ fontSize: '24px' }}>
        Listing not found.
      </p>
    </div>
  );
}

function MinimalHeader({ heroImage }: { heroImage?: string }) {
  return (
    <header
      className="relative overflow-hidden"
      style={{ width: '1080px', height: '620px', flexShrink: 0 }}
    >
      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--brand-primary))' }} />
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
