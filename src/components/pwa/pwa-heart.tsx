/**
 * Corazón de favoritos de la PWA. Mismo path que la card del kiosk
 * (viewBox 0 0 24 24, no se corta) y color rojo tokenizado `--pwa-favorite`
 * para consistencia entre productos. Relleno cuando está activo.
 */
const FAV = 'hsl(var(--pwa-favorite))';

export function PwaHeart({ filled, size = 26 }: { filled?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? FAV : 'none'}
      stroke={FAV}
      strokeWidth={filled ? 0 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
