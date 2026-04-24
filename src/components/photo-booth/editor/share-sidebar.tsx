'use client';

interface ShareSidebarProps {
  onShare: () => void;
  ariaLabel: string;
}

/**
 * Botón "Share" circular verbatim del SVG `4-Photo_Booth-Experience.svg`:
 *   - translate(921, 903), circle r=58 fill="#0e518a".
 *   - QR icon interno (paths verbatim).
 *   - Texto "Share" debajo del círculo (font Montserrat-Bold 19px).
 */
export function ShareSidebar({ onShare, ariaLabel }: ShareSidebarProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onShare}
      className="absolute"
      style={{
        left: 921,
        top: 903,
        width: 116,
        height: 140,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <svg width={116} height={140} viewBox="0 0 116 140" aria-hidden="true">
        <circle cx={58} cy={58} r={58} fill="#0e518a" />
        <g transform="translate(2.554 -7.445)">
          <rect x={64.448} y={63.444} width={8} height={9} rx={4} fill="#fff" />
          <rect x={57.448} y={57.444} width={7} height={6} rx={3} fill="#fff" />
          <rect x={72.448} y={72.444} width={6} height={6} rx={3} fill="#fff" />
          <rect x={74.448} y={57.444} width={4} height={4} rx={2} fill="#fff" />
          <rect x={57.448} y={73.444} width={5} height={5} rx={2.5} fill="#fff" />
          <path
            d="M290.422,32H275.349A3.349,3.349,0,0,0,272,35.349V50.422a3.349,3.349,0,0,0,3.349,3.349h15.073a3.349,3.349,0,0,0,3.349-3.349V35.349A3.349,3.349,0,0,0,290.422,32Zm-3.349,14.235a.837.837,0,0,1-.837.837h-6.7a.837.837,0,0,1-.837-.837v-6.7a.837.837,0,0,1,.837-.837h6.7a.837.837,0,0,1,.837.837Z"
            transform="translate(-214.879)"
            fill="#fff"
          />
          <path
            d="M50.422,32H35.349A3.349,3.349,0,0,0,32,35.349V50.422a3.349,3.349,0,0,0,3.349,3.349H50.422a3.349,3.349,0,0,0,3.349-3.349V35.349A3.349,3.349,0,0,0,50.422,32ZM47.073,46.235a.837.837,0,0,1-.837.837h-6.7a.837.837,0,0,1-.837-.837v-6.7a.837.837,0,0,1,.837-.837h6.7a.837.837,0,0,1,.837.837Z"
            fill="#fff"
          />
          <path
            d="M50.422,272H35.349A3.349,3.349,0,0,0,32,275.349v15.073a3.349,3.349,0,0,0,3.349,3.349H50.422a3.349,3.349,0,0,0,3.349-3.349V275.349A3.349,3.349,0,0,0,50.422,272Zm-3.349,14.235a.837.837,0,0,1-.837.837h-6.7a.837.837,0,0,1-.837-.837v-6.7a.837.837,0,0,1,.837-.837h6.7a.837.837,0,0,1,.837.837Z"
            transform="translate(0 -214.879)"
            fill="#fff"
          />
        </g>
        <text
          x={58}
          y={131}
          textAnchor="middle"
          fill="#fff"
          fontSize={19}
          fontFamily="'Montserrat', system-ui"
          fontWeight={700}
        >
          Share
        </text>
      </svg>
    </button>
  );
}
