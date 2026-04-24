'use client';

interface ShareSidebarProps {
  onShare: () => void;
  ariaLabel: string;
}

/**
 * Botón "Share Photo" del editor — icono universal de Share + texto en
 * dos líneas debajo. Flechas animadas en loop apuntando hacia arriba al
 * botón para llamar la atención (~similar a un onboarding bounce).
 */
export function ShareSidebar({ onShare, ariaLabel }: ShareSidebarProps) {
  return (
    <div
      className="absolute"
      style={{
        left: 921,
        top: 850,
        width: 140,
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Flechas animadas (3 chevrons que se rellenan en loop apuntando arriba) */}
      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          marginBottom: 6,
        }}
      >
        {[0, 1, 2].map((i) => (
          <svg
            key={i}
            width={48}
            height={20}
            viewBox="0 0 48 20"
            style={{
              animation: `pb-share-arrow 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }}
          >
            <path
              d="M4 16 L24 4 L44 16"
              stroke="hsl(var(--photo-share-arrow, var(--photo-tabs-bg)))"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ))}
      </div>
      {/* Botón Share circular con icono universal de Share */}
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onShare}
        style={{
          width: 116,
          height: 116,
          padding: 0,
          border: 'none',
          borderRadius: '50%',
          background: '#0e518a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width={56} height={56} viewBox="0 0 24 24" aria-hidden="true">
          {/* Icono Share (3 nodos + 2 conectores) — convención iOS/Material */}
          <circle cx="18" cy="5" r="3" fill="#fff" />
          <circle cx="6" cy="12" r="3" fill="#fff" />
          <circle cx="18" cy="19" r="3" fill="#fff" />
          <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </button>
      {/* Texto "Share Photo" en 2 líneas */}
      <div
        style={{
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 22,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.15,
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        <div>Share</div>
        <div>Photo</div>
      </div>
      <style jsx>{`
        @keyframes pb-share-arrow {
          0%,
          100% {
            opacity: 0.25;
            transform: translateY(4px);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}
