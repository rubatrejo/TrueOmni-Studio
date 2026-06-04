'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAvailableLocales, useCurrentLocale } from '@/components/i18n-provider';
import type { PwaMoreItem, SurveyConfig } from '@/lib/config';
import { LOCALE_LABELS } from '@/lib/i18n';

import { PwaBottomNav } from './bottom-nav';
import { InboxIcon, SearchIcon } from './dashboard-icons';
import { Layer } from './mobile-layer';
import { GlobeIcon, PwaLanguageSheet } from './pwa-language-sheet';
import { PwaSurveyOverlay } from './pwa-survey-overlay';

const BRAND = 'hsl(var(--brand-primary))';
const OLIVE = 'hsl(var(--brand-tertiary))';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Destino de cada item del More. Solo se cablean los que ya tienen pantalla;
 * el resto queda sin navegación hasta que exista su módulo.
 */
const ITEM_HREF: Record<string, string> = {
  'connect-with-us': '/pwa/connect-with-us',
  'my-profile': '/pwa/profile',
  help: '/pwa/help',
  'digital-brochure': '/pwa/digital-brochure',
  'interactive-trails': '/pwa/trails',
  deals: '/pwa/deals',
  tickets: '/pwa/tickets',
  wayfinding: '/pwa/wayfinding',
  'scavenger-hunt': '/pwa/scavenger-hunt',
};

interface MoreScreenProps {
  searchPlaceholder: string;
  weatherText: string;
  items: PwaMoreItem[];
  /** Config del Survey (reusa `features.home.survey`); si falta/disabled, el item no abre. */
  survey?: SurveyConfig;
  /** Slug del cliente activo (para el payload del resultado del survey). */
  clientSlug?: string;
}

/**
 * More Menu de la PWA (`/pwa/more`) — pantalla 04. Último icono del bottom nav.
 *
 * Verbatim del XD (375×812): header (search bar 285×32 blanco 25% + inbox) +
 * banda olive (`--brand-tertiary`) con ubicación/clima + lista de accesos
 * centrados (16px) + bottom nav con "more" activo. White-label: textos e items
 * desde `config.features.pwa.more`; colores por token.
 */
export function MoreScreen({
  searchPlaceholder,
  weatherText,
  items,
  survey,
  clientSlug,
}: MoreScreenProps) {
  const router = useRouter();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  // Selector de idioma: solo tiene sentido con >1 idioma disponible (D1).
  const availableLocales = useAvailableLocales();
  const currentLocale = useCurrentLocale();
  const showLanguage = availableLocales.length > 1;

  /** Survey abre como popup (no navega); el resto usa `ITEM_HREF`. */
  const handleItem = (key: string) => {
    if (key === 'survey') {
      if (survey?.enabled) setSurveyOpen(true);
      return;
    }
    const href = ITEM_HREF[key];
    if (href) router.push(href);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header: search bar + inbox */}
      <Layer h={90} className="relative z-10 shrink-0" style={{ backgroundColor: BRAND }}>
        <div
          className="absolute flex items-center gap-2 rounded-full px-[14px]"
          style={{
            left: 20,
            top: 46,
            width: 285,
            height: 40,
            backgroundColor: 'hsl(0 0% 100% / 0.25)',
          }}
        >
          <SearchIcon size={15} className="shrink-0 text-white" />
          <span className="truncate text-white" style={{ fontSize: 15, ...OPEN_SANS }}>
            {searchPlaceholder}
          </span>
        </div>
        <div className="absolute text-white" style={{ left: 334, top: 54 }}>
          <InboxIcon size={24} />
        </div>
      </Layer>

      {/* Banda olive: ubicación + clima */}
      <Layer h={43} className="shrink-0" style={{ backgroundColor: OLIVE }}>
        <div
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ fontSize: 14, ...OPEN_SANS }}
        >
          {weatherText}
        </div>
      </Layer>

      {/* Lista de accesos (centrados, spacing 52 del XD) */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => handleItem(it.key)}
            className="flex h-[54px] w-full items-center justify-center text-foreground"
            style={{ fontSize: 16, ...OPEN_SANS }}
          >
            {it.label}
          </button>
        ))}
        {/* Selector de idioma (chrome de la app; muestra el idioma activo) — D1 */}
        {showLanguage ? (
          <button
            type="button"
            aria-label="Language"
            onClick={() => setLanguageOpen(true)}
            className="flex h-[54px] w-full items-center justify-center gap-2 text-foreground"
            style={{ fontSize: 16, ...OPEN_SANS }}
          >
            <GlobeIcon size={18} />
            {LOCALE_LABELS[currentLocale] ?? currentLocale}
          </button>
        ) : null}
      </div>

      {/* Bottom nav fijo, "more" activo */}
      <PwaBottomNav active="more" />

      {/* Survey popup (reusa `features.home.survey`) */}
      {surveyOpen && survey ? (
        <PwaSurveyOverlay
          config={survey}
          clientSlug={clientSlug ?? 'default'}
          onClose={() => setSurveyOpen(false)}
        />
      ) : null}

      {/* Selector de idioma (bottom-sheet) */}
      <PwaLanguageSheet open={languageOpen} onClose={() => setLanguageOpen(false)} />
    </div>
  );
}
