import Link from 'next/link';
import { notFound } from 'next/navigation';

import { KioskCanvas } from '@/components/kiosk-canvas';
import { ListingsModule } from '@/components/listings/listings-module';
import { getConfig } from '@/lib/config';

interface PageProps {
  params: Promise<{ module: string }>;
}

/**
 * Ruta dinámica del módulo.
 *   - Si `features.home.modules[module]` existe → renderiza ListingsModule
 *     (Restaurants / Things to Do / Stay).
 *   - Si `module === 'wayfinding'` o está entre los tiles habilitados →
 *     placeholder "Coming soon".
 *   - Si no existe → notFound.
 */
export default async function ModulePage({ params }: PageProps) {
  const { module } = await params;
  const config = await getConfig();
  const home = config.features?.home;
  if (!home) notFound();

  // Módulo de listings (Restaurants / Things to Do / Stay)
  const mod = home.modules?.[module];
  if (mod) {
    return (
      <KioskCanvas>
        <ListingsModule moduleKey={module} module={mod} />
      </KioskCanvas>
    );
  }

  // Validar que el módulo exista como tile (placeholder stub) o como wayfinding
  const tile = home.tiles.find((t) => t.key === module);
  const isWayfinding = module === 'wayfinding' && home.wayfinding?.enabled;
  if (!tile && !isWayfinding) notFound();

  const label = tile?.label ?? home.wayfinding?.label ?? module;
  return (
    <KioskCanvas>
      <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-white px-10 text-center">
        <h1
          className="font-display font-bold uppercase text-[#004f8b]"
          style={{ fontSize: '90px', letterSpacing: '0.02em' }}
        >
          {label}
        </h1>
        <p className="font-sans text-gray-600" style={{ fontSize: '32px' }}>
          Coming soon
        </p>
        <Link
          href="/home"
          className="mt-4 inline-flex items-center justify-center rounded-[10px] bg-[#004f8b] font-sans font-bold uppercase text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          style={{ fontSize: '26px', padding: '16px 40px', letterSpacing: '0.02em' }}
        >
          Back to Home
        </Link>
      </div>
    </KioskCanvas>
  );
}
