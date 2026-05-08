import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * `/studio/[slug]` — Vista del cliente (placeholder durante Fase 1).
 *
 * Esta ruta se transformará en la Vista del Cliente (branding + product
 * cards) durante la Fase 3 del refactor. Mientras tanto redirige al editor
 * del kiosk para no romper bookmarks/links existentes.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export default async function ClientViewPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/studio/${slug}/kiosk`);
}
