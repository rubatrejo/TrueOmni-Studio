import { notFound } from 'next/navigation';

import { HomeHeader } from '@/components/home/header';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { ListingDetail } from '@/components/listings/listing-detail';
import { ListingsModule } from '@/components/listings/listings-module';
import { getConfig } from '@/lib/config';

interface PageProps {
  params: Promise<{ module: string; slug: string }>;
}

/**
 * Detail screen de un listing.
 *
 * Render: el grid del módulo como background + el card de detail encima con
 * overlay oscuro (por eso el detail tiene el `rgba(0,0,0,0.8)` overlay —
 * está sobre el contenido de la ruta padre).
 */
export default async function ListingDetailPage({ params }: PageProps) {
  const { module, slug } = await params;
  const config = await getConfig();
  const mod = config.features?.home?.modules?.[module];
  if (!mod) notFound();

  const listing = mod.listings.find((l) => l.slug === slug);
  if (!listing) notFound();

  const mapboxToken = config.integraciones?.mapbox_token;

  return (
    <KioskCanvas>
      {/* Grid de listings como background */}
      <ListingsModule
        moduleKey={module}
        module={mod}
        clientCoords={config.client.coords}
        header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
      />
      {/* Detail overlay encima */}
      <ListingDetail
        moduleKey={module}
        listing={listing}
        mapboxToken={mapboxToken}
        clientCoords={config.client.coords}
      />
    </KioskCanvas>
  );
}
