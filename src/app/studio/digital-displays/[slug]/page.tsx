import { notFound, redirect } from 'next/navigation';

import { listSignageDisplays } from '@/lib/signage/config';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * `/studio/digital-displays/[slug]` — Compat redirect al primer display.
 *
 * El theme editor anterior se ha consolidado dentro del display editor:
 * branding, header, events, social, news, i18n y settings se editan ahora
 * por display (con los datos del client subyacente compartidos entre
 * displays del mismo cliente). Las URLs viejas redirigen al primer display
 * disponible para no romper bookmarks.
 */
export default async function ThemeRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const displays = await listSignageDisplays(slug);
  if (displays.length === 0) notFound();
  redirect(`/studio/digital-displays/${slug}/displays/${displays[0].slug}`);
}
