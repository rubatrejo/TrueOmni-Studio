'use client';

import { SocialSourceIcon } from '@/components/social-wall/social-source-icon';
import type { SocialSource } from '@/lib/config';

const PWA = 'hsl(var(--pwa-primary))';
const FG_MUTED = 'hsl(var(--foreground) / 0.5)';
const OPEN_SANS = 'var(--font-open-sans)';

/**
 * Tabs por red social (PWA). "All" + un icono por red con `handle` configurado;
 * scroll horizontal, subrayado en la activa. Filtra el muro vía `onSelect`.
 */
export function PwaSocialTabs({
  sources,
  active,
  allLabel,
  onSelect,
}: {
  sources: SocialSource[];
  active: SocialSource | 'all';
  allLabel: string;
  onSelect: (next: SocialSource | 'all') => void;
}) {
  const isActive = (k: SocialSource | 'all') => active === k;
  return (
    <div
      className="scrollbar-hide flex shrink-0 items-center gap-5 overflow-x-auto border-b px-4"
      style={{ height: 46, borderColor: 'hsl(var(--foreground) / 0.1)' }}
    >
      <button
        type="button"
        onClick={() => onSelect('all')}
        aria-pressed={isActive('all')}
        className="relative flex h-full shrink-0 items-center"
        style={{
          fontSize: 14,
          fontFamily: OPEN_SANS,
          fontWeight: isActive('all') ? 700 : 500,
          color: isActive('all') ? PWA : FG_MUTED,
        }}
      >
        {allLabel}
        {isActive('all') && <ActiveBar />}
      </button>
      {sources.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          aria-pressed={isActive(s)}
          aria-label={s}
          className="relative flex h-full shrink-0 items-center"
          style={{ color: isActive(s) ? PWA : FG_MUTED }}
        >
          <SocialSourceIcon source={s} size={20} color="currentColor" />
          {isActive(s) && <ActiveBar />}
        </button>
      ))}
    </div>
  );
}

function ActiveBar() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 bottom-0 rounded-t"
      style={{ height: 3, backgroundColor: PWA }}
    />
  );
}
