import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { WayfindingDirections } from '@/components/pwa/wayfinding-directions';
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

  // Buscar la amenidad por slug en todos los pisos
  let foundFloor = wf.floors[0];
  let foundAmenity = wf.floors[0]?.amenities[0];

  for (const floor of wf.floors) {
    const match = floor.amenities.find((a) => a.slug === amenitySlug);
    if (match) {
      foundFloor = floor;
      foundAmenity = match;
      break;
    }
  }

  if (!foundAmenity) {
    return (
      <MobileCanvas>
        <div className="flex h-full items-center justify-center text-gray-400">
          Amenity not found
        </div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <WayfindingDirections config={wf} floor={foundFloor} amenity={foundAmenity} />
    </MobileCanvas>
  );
}
