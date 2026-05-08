import { notFound } from 'next/navigation';

import {
  loadSignageClient,
  loadSignageDisplay,
  loadSignageTokensCss,
} from '@/lib/signage/config';

import { DisplayEditor } from '../../../digital-displays/_components/DisplayEditor';

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
 * `/studio/[slug]/digital-displays/[displaySlug]` — Editor de display.
 *
 * Ruta nueva (post-refactor: cliente como entidad unificada). Server component
 * que carga client + display en paralelo y los pasa al `<DisplayEditor>`
 * (client). La URL anterior
 * `/studio/digital-displays/[slug]/displays/[displaySlug]` redirige aquí.
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
