import { notFound } from 'next/navigation';

import { HelpArticleScreenLive } from '@/components/pwa/help-article-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Help — detalle de artículo (`/pwa/help/[slug]`). Título + cuerpo + "Was this answer
 * helpful? YES/NO" → Thanks. Contenido desde `config.features.pwa.help.articles`.
 */
export default async function PwaHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const h = config.features?.pwa?.help;
  if (!h) notFound();

  const article = h.articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const clientName = config.client?.nombre ?? '';

  return (
    <MobileCanvas>
      <HelpArticleScreenLive
        config={h}
        headerTitle={h.title}
        question={article.question}
        answer={article.answer.replace(/\{client_name\}/g, clientName)}
        helpfulPrompt={h.helpfulPrompt}
        helpfulYes={h.helpfulYes}
        helpfulNo={h.helpfulNo}
        thanks={h.thanks}
      />
    </MobileCanvas>
  );
}
