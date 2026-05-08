import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Redirect compat: la URL antigua `/studio/digital-displays/[slug]` redirigía
 * al primer display. Tras el refactor de cliente unificado, esa funcionalidad
 * vive en `/studio/[slug]/digital-displays`. Aquí solo redirigimos a la vista
 * del cliente para evitar romper bookmarks; la lista scoped por cliente
 * aterriza en Fase 6.
 */
export default async function ThemeRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/studio/${slug}`);
}
