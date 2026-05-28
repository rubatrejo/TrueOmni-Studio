import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { SearchScreen } from '@/components/pwa/search-screen';
import { getConfig } from '@/lib/config';
import { buildSearchIndex } from '@/lib/pwa-search';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  placeholder: 'Search destinations, events…',
  recentTitle: 'RECENT',
  browseTitle: 'BROWSE',
  clearAll: 'Clear all',
  noResults: 'No results for “{query}”',
  typeSection: 'Section',
  typeEvent: 'Event',
};

/**
 * Search (`/pwa/search`) — abierta desde la lupa del Dashboard. El índice buscable se
 * construye server-side desde config (secciones + listings + eventos) y se filtra en el
 * cliente. Textos desde `config.features.pwa.search`.
 */
export default async function PwaSearchPage() {
  const config = await getConfig();
  const s = config.features?.pwa?.search ?? FALLBACK;
  const index = buildSearchIndex(config, { section: s.typeSection, event: s.typeEvent });
  const browse = index
    .filter((it) => it.type === 'section')
    .map((it) => it.title)
    .slice(0, 8);

  return (
    <MobileCanvas>
      <SearchScreen
        texts={{
          placeholder: s.placeholder,
          recentTitle: s.recentTitle,
          browseTitle: s.browseTitle,
          clearAll: s.clearAll,
          noResults: s.noResults,
        }}
        index={index}
        browse={browse}
      />
    </MobileCanvas>
  );
}
