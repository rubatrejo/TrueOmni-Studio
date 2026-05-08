import { notFound } from 'next/navigation';

import {
  loadSignageClient,
  loadSignageDisplay,
  loadSignageTokensCss,
} from '@/lib/signage/config';

import { DisplayEditor } from '../../../_components/DisplayEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; displaySlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, displaySlug } = await params;
  return {
    title: `${displaySlug} · ${slug} · Digital Displays · TrueOmni Studio`,
  };
}

/**
 * `/studio/digital-displays/[slug]/displays/[displaySlug]` — Display editor (DSS2).
 *
 * Server component que carga client + display en paralelo y los pasa al
 * `<DisplayEditor>` (client). El editor renderiza un sidebar con settings +
 * playlist read-only y un preview iframe live del runtime al lado.
 *
 * Read-only en DSS2. Edición de settings / drag-to-reorder de playlist
 * aterriza en DSS4. Bridge bidireccional editor↔iframe en DSS3.
 */
export default async function DisplayEditorPage({ params }: PageProps) {
  const { slug, displaySlug } = await params;
  const [client, display, tokensCss] = await Promise.all([
    loadSignageClient(slug),
    loadSignageDisplay(slug, displaySlug),
    loadSignageTokensCss(slug).catch(() => ''),
  ]);

  if (!client || !display) notFound();

  return (
    <DisplayEditor client={client} display={display} tokensCss={tokensCss} />
  );
}
