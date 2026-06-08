import { notFound } from 'next/navigation';

import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { PassDetailScreenLive } from '@/components/pwa/pass-detail-screen-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Passes — detalle del pass (#2). Hero + tagline + lista de actividades incluidas
 * (cada una con "View Website" → sitio externo). El pass viene del kiosk
 * (`home.modules.passes`); los textos desde `config.features.pwa.passes`.
 */
export default async function PwaPassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getConfig();
  const texts = config.features?.pwa?.passes;
  const mod = config.features?.home?.modules?.passes;
  if (!texts || !mod || mod.kind !== 'passes') notFound();

  const pass = mod.passes.find((p) => p.slug === slug);
  if (!pass) notFound();

  return (
    <MobileCanvas>
      <PassDetailScreenLive pass={pass} config={texts} />
    </MobileCanvas>
  );
}
