import Link from 'next/link';

/**
 * Floating home button circular en el borde izquierdo del canvas.
 * Click → `/home`. Visible en módulos de Listings.
 */
export function FloatingHomeButton() {
  return (
    <Link
      href="/home"
      aria-label="Volver al Home"
      className="absolute z-10 flex items-center justify-center text-white shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        left: '-40px',
        top: '1080px',
        width: '120px',
        height: '120px',
        borderRadius: '60px',
        backgroundColor: '#004f8b',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        style={{ marginLeft: '20px' }}
      >
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    </Link>
  );
}
