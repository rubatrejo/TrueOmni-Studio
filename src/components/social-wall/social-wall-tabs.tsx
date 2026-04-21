'use client';

import type { SocialSource } from '@/lib/config';

import { SocialSourceIcon } from './social-source-icon';

/**
 * Tabs de filtro por red social.
 *
 *  [  All Post  ] [ X ] [ IG ] [ Pinterest ] [ YT ]
 *       ━━━━━━
 *
 * - Solo aparecen los iconos de las redes con `handles[source]` configurado.
 * - Active = subrayado azul + texto azul. Inactive = negro/60.
 * - Altura 80px, background blanco, separator inferior #eee.
 */
export function SocialWallTabs({
  sources,
  active,
  onSelect,
}: {
  /** Las sources que tiene el cliente configuradas (orden importa). */
  sources: readonly SocialSource[];
  /** `'all'` o una source. */
  active: SocialSource | 'all';
  onSelect: (next: SocialSource | 'all') => void;
}) {
  return (
    <div
      role="tablist"
      className="flex items-center"
      style={{
        width: '1080px',
        height: '84px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 48px',
        columnGap: '36px',
        flexShrink: 0,
      }}
    >
      {/* All Post */}
      <TabButton selected={active === 'all'} onClick={() => onSelect('all')}>
        <span
          className="font-sans"
          style={{
            fontSize: '22px',
            lineHeight: '22px',
            fontWeight: 700,
            letterSpacing: '0.01em',
          }}
        >
          All Post
        </span>
      </TabButton>

      {sources.map((source) => (
        <TabButton
          key={source}
          selected={active === source}
          onClick={() => onSelect(source)}
          ariaLabel={`Filtrar por ${source}`}
        >
          <SocialSourceIcon
            source={source}
            size={30}
            color={active === source ? '#1796d6' : 'rgba(0,0,0,0.78)'}
          />
        </TabButton>
      ))}
    </div>
  );
}

function TabButton({
  selected,
  onClick,
  children,
  ariaLabel,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className="relative flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{
        height: '84px',
        minWidth: '60px',
        padding: '0 6px',
        color: selected ? '#1796d6' : 'rgba(0,0,0,0.78)',
      }}
    >
      {children}
      {selected ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '4px',
            right: '4px',
            bottom: '-1px',
            height: '4px',
            backgroundColor: '#1796d6',
            borderRadius: '2px 2px 0 0',
          }}
        />
      ) : null}
    </button>
  );
}
