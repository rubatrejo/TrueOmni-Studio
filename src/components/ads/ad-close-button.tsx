'use client';

import type { AdTheme } from '@/lib/config';

/**
 * Botón X reusable para los 3 tipos de ad.
 *
 * - `theme: 'dark'` (default) → X blanca con sombra oscura, apto para ads con
 *   fondo oscuro (ej. popup teal, hero Van Gogh, Uber Eats pool).
 * - `theme: 'light'` → X negra con sombra clara, apto para ads con fondo claro.
 */
interface AdCloseButtonProps {
  theme?: AdTheme;
  size?: number;
  style?: React.CSSProperties;
  onClick: () => void;
}

export function AdCloseButton({ theme = 'dark', size = 44, style, onClick }: AdCloseButtonProps) {
  const isLight = theme === 'light';
  const strokeColor = isLight ? '#111' : '#ffffff';
  const dropShadow = isLight
    ? 'drop-shadow(0 1px 2px rgba(255,255,255,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.6)) drop-shadow(0 2px 6px rgba(0,0,0,0.45))';

  const iconSize = Math.round(size * 0.55);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close advertisement"
      className="absolute inline-flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'transparent',
        filter: dropShadow,
        ...style,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke={strokeColor}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
