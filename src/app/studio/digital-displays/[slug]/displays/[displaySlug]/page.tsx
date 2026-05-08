import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; displaySlug: string }>;
}

/**
 * Redirect compat: la URL antigua del display editor era
 * `/studio/digital-displays/[slug]/displays/[displaySlug]`. Tras el refactor
 * de cliente unificado vive en `/studio/[slug]/digital-displays/[displaySlug]`.
 */
export default async function DisplayEditorRedirect({ params }: PageProps) {
  const { slug, displaySlug } = await params;
  redirect(`/studio/${slug}/digital-displays/${displaySlug}`);
}
