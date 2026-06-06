import { notFound } from 'next/navigation';

import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { WayfindingDirectionsLive } from '@/components/pwa/wayfinding-directions-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Pantalla de Directions de una amenidad (`/pwa/wayfinding/[slug]`): floor
 * plan con ruta SVG dinámica + pasos textuales + botones GO BACK / THANKS.
 */
export default async function PwaWayfindingDirectionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: amenitySlug } = await params;
  const config = await getConfig();
  const wf = config.features?.pwa?.wayfinding;

  if (!wf) {
    return (
      <MobileCanvas>
        <div className="flex h-full items-center justify-center text-gray-400">
          Wayfinding not configured
        </div>
      </MobileCanvas>
    );
  }

  // Buscar la amenidad por slug en todos los pisos. Slug inválido → 404 real (C7):
  // sin fallback al primer piso/amenidad (que mostraba la pantalla equivocada con HTTP 200).
  const found = wf.floors
    .flatMap((floor) => floor.amenities.map((amenity) => ({ floor, amenity })))
    .find((x) => x.amenity.slug === amenitySlug);

  if (!found) notFound();

  return (
    <MobileCanvas>
      <WayfindingDirectionsLive
        amenitySlug={amenitySlug}
        config={wf}
        floor={found.floor}
        amenity={found.amenity}
      />
    </MobileCanvas>
  );
}
