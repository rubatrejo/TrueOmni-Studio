'use client';

interface ShareSidebarProps {
  onShare: () => void;
  ariaLabel: string;
}

/**
 * Botón "Share Photo" del editor.
 * - Icono: arrow-out-of-box (Material/iOS share alternative).
 * - Texto: "Share Photo" en 2 líneas, negro, debajo del botón.
 * - Flechas: 3 chevrons DOWN animados arriba del botón apuntando hacia él.
 */
export function ShareSidebar({ onShare, ariaLabel }: ShareSidebarProps) {
  return (
    <div
      className="absolute"
      style={{
        left: 921,
        top: 760,
        width: 140,
        height: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Flechas DOWN apuntando AL botón (3 chevrons en cascada animada) */}
      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          marginBottom: 10,
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
              d="M4 4 L24 16 L44 4"
              stroke="hsl(var(--photo-tabs-bg))"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ))}
      </div>
      {/* Botón Share circular con icono arrow-out-of-box */}
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
          background: 'hsl(var(--photo-tabs-bg))',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {/* Arrow-out-of-box icon */}
        <svg width={56} height={56} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3v12M12 3l-4 4M12 3l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"
            stroke="#fff"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
      {/* Texto "Share Photo" en 2 líneas, negro */}
      <div
        style={{
          color: '#000',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 22,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.15,
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
            transform: translateY(-4px);
          }
          50% {
            opacity: 1;
            transform: translateY(2px);
          }
        }
      `}</style>
    </div>
  );
}
