import type { SocialHighlight } from '@/lib/config';

/**
 * Banda azul al bottom del hero con "Highlights:" + 3 círculos + `#hashtag`.
 * Se renderiza como hijo del HomeHeader (overlay al bottom del hero).
 *
 * Dimensiones aproximadas (pixel-perfect pendiente vs SVG):
 *   - altura: ~170px
 *   - fondo: #004f8b
 *   - círculos: d=80, bordes blancos, margen entre ellos 12px
 *   - hashtag: Helvetica 40 bold white, alineado derecha
 */
export function SocialWallBanner({
  highlights,
  hashtag,
}: {
  highlights: readonly SocialHighlight[];
  hashtag: string;
}) {
  return (
    <div
      className="absolute left-0 right-0 flex items-end"
      style={{
        bottom: 0,
        width: '1080px',
        height: '220px',
        background:
          'linear-gradient(180deg, rgba(0,79,139,0) 0%, rgba(0,79,139,0.55) 28%, rgba(0,79,139,0.88) 55%, #004f8b 100%)',
        padding: '40px 48px 22px 48px',
        gap: '48px',
      }}
    >
      {/* Izquierda: label + círculos */}
      <div className="flex flex-col" style={{ rowGap: '10px' }}>
        <span
          className="font-sans text-white"
          style={{
            fontSize: '22px',
            lineHeight: '22px',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          Highlights:
        </span>
        <div className="flex items-center" style={{ columnGap: '14px' }}>
          {highlights.slice(0, 4).map((h) => (
            <HighlightCircle key={h.id} highlight={h} />
          ))}
        </div>
      </div>

      {/* Derecha: hashtag grande alineado con los círculos */}
      <div className="ml-auto flex items-end" style={{ paddingBottom: '4px' }}>
        <span
          className="font-sans text-white"
          style={{
            fontSize: '44px',
            lineHeight: '44px',
            fontWeight: 800,
            letterSpacing: '0.01em',
          }}
        >
          #{hashtag}
        </span>
      </div>
    </div>
  );
}

function HighlightCircle({ highlight }: { highlight: SocialHighlight }) {
  return (
    <div
      aria-label={highlight.label ?? 'Highlight'}
      className="relative overflow-hidden"
      style={{
        width: '82px',
        height: '82px',
        borderRadius: '50%',
        border: '3px solid #ffffff',
        backgroundColor: '#ffffff',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={highlight.image}
        alt=""
        className="h-full w-full object-cover"
        style={{ borderRadius: '50%' }}
      />
    </div>
  );
}
