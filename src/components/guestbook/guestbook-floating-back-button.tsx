'use client';

/**
 * Variante "back" del FloatingHomeButton para las pantallas internas del
 * Guestbook (form, map, …). Misma geometría (pill azul 116×232 que sale
 * del borde izquierdo) pero con flecha ← del asset `button-back.svg` del
 * XD y `onClick` en vez de un Link a `/home`.
 */
export function GuestbookFloatingBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Volver"
      className="absolute z-30 flex items-center justify-end focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        left: 0,
        top: '1000px',
        width: '116px',
        height: '232px',
        backgroundColor: 'hsl(var(--brand-primary))',
        borderTopRightRadius: '116px',
        borderBottomRightRadius: '116px',
        paddingRight: '28px',
        boxShadow: '12px 0 28px rgba(0,0,0,0.22)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="45"
        height="50"
        viewBox="0 0 44.824 50.443"
        aria-hidden
      >
        <path
          d="M23.489,0a4.559,4.559,0,0,1,2.242,1.624c.65.749,1.334,1.461,2,2.2a3.462,3.462,0,0,1-.015,4.885q-4.87,5.345-9.749,10.68c-.113.124-.221.253-.412.474h.614q11.722,0,23.445-.006A2.855,2.855,0,0,1,44.5,21.67a4.867,4.867,0,0,1,.31,1.708c.04,1.245.005,2.492-.005,3.738-.018,2.132-1.228,3.458-3.18,3.465-2.68.009-5.36,0-8.039,0h-16c.184.215.3.354.415.484q4.851,5.3,9.7,10.592a3.172,3.172,0,0,1,.614,4,27.824,27.824,0,0,1-3.874,4.261,2.455,2.455,0,0,1-3.356-.341c-.114-.106-.224-.217-.33-.333Q10.9,38.462,1.057,27.677a3.427,3.427,0,0,1-.636-4.1A4.415,4.415,0,0,1,1.07,22.7q9.824-10.772,19.651-21.54A4.305,4.305,0,0,1,22.5,0Z"
          fill="#ffffff"
        />
      </svg>
    </button>
  );
}
