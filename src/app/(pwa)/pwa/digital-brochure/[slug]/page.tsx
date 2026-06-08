import { notFound } from 'next/navigation';

import { BrochureReaderScreenLive } from '@/components/pwa/brochure-reader-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Digital Brochure — reader (`/pwa/digital-brochure/[slug]`). Visor de PDF (pdf.js)
 * réplica mobile del kiosk. El brochure se reutiliza del kiosk
 * (`home.modules['digital-brochure']`); los textos desde
 * `config.features.pwa.digitalBrochure`.
 */
export default async function PwaBrochureReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const texts = config.features?.pwa?.digitalBrochure;
  const mod = config.features?.home?.modules?.['digital-brochure'];
  if (!texts || !mod || mod.kind !== 'digital-brochure') notFound();

  const brochure = mod.brochures.find((b) => b.slug === slug);
  if (!brochure) notFound();

  return (
    <MobileCanvas>
      <BrochureReaderScreenLive brochure={brochure} config={texts} />
    </MobileCanvas>
  );
}
