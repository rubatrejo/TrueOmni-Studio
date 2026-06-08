import { HelpScreenLive } from '@/components/pwa/help-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Help — centro de ayuda (landing). Búsqueda + FAQs por categoría + Contact Support.
 * Textos/artículos desde `config.features.pwa.help`. Las respuestas admiten
 * `{client_name}`, interpolado aquí con el nombre del cliente.
 */
export default async function PwaHelpPage() {
  const config = await getConfig();
  const h = config.features?.pwa?.help;

  if (!h) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  const clientName = config.client?.nombre ?? '';
  const articles = h.articles.map((a) => ({
    ...a,
    answer: a.answer.replace(/\{client_name\}/g, clientName),
  }));

  return (
    <MobileCanvas>
      <HelpScreenLive
        config={h}
        title={h.title}
        searchPlaceholder={h.searchPlaceholder}
        noResults={h.noResults}
        needMoreTitle={h.needMoreTitle}
        needMoreBody={h.needMoreBody}
        contactCta={h.contactCta}
        articles={articles}
      />
    </MobileCanvas>
  );
}
