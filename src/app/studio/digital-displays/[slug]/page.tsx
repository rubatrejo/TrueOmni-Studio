import { notFound } from 'next/navigation';

import {
  listSignageDisplays,
  loadSignageClient,
  loadSignageTokensCss,
} from '@/lib/signage/config';

import { ThemeEditor } from '../_components/ThemeEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `${slug} · Digital Displays · TrueOmni Studio`,
  };
}

/**
 * `/studio/digital-displays/[slug]` — Editor del signage theme (DSS1).
 *
 * Server component que carga client + displays + tokens en paralelo. Pasa todo
 * al `<ThemeEditor>` (client) que orquesta los 5 tabs. **DSS1 es read-only**:
 * muestra la configuración del theme tal como vive en `clients-signage/<slug>/`.
 * Los formularios editables aterrizan en DSS5+.
 */
export default async function ThemeEditorPage({ params }: PageProps) {
  const { slug } = await params;
  const [client, displays, tokensCss] = await Promise.all([
    loadSignageClient(slug),
    listSignageDisplays(slug),
    loadSignageTokensCss(slug).catch(() => ''),
  ]);

  if (!client) notFound();

  return <ThemeEditor client={client} displays={displays} tokensCss={tokensCss} />;
}
