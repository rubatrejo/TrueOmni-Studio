'use client';

/**
 * Banda azul del reader: título izq + botones SEND TO EMAIL y SEND TO PHONE
 * a la derecha. Altura 96px, fondo `#004f8b`.
 *
 * La navegación "volver" se hace con el `BackButton` flotante del layout
 * del reader (no dentro del header).
 */
export function BrochureReaderHeader({
  title,
  onSendEmail,
  onSendPhone,
}: {
  title: string;
  onSendEmail: () => void;
  onSendPhone: () => void;
}) {
  return (
    <div
      className="relative flex items-center"
      style={{
        width: '1080px',
        height: '96px',
        backgroundColor: '#004f8b',
        padding: '0 24px 0 32px',
        flexShrink: 0,
      }}
    >
      <span
        className="font-sans text-white"
        style={{
          flex: 1,
          fontSize: '26px',
          lineHeight: '26px',
          fontWeight: 600,
          letterSpacing: '0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>

      <div className="flex items-center" style={{ columnGap: '12px' }}>
        <button
          type="button"
          onClick={onSendEmail}
          className="font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            height: '60px',
            padding: '0 24px',
            borderRadius: '8px',
            backgroundColor: '#b9bd39',
            color: '#fff',
            fontSize: '18px',
            lineHeight: '18px',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          SEND TO EMAIL
        </button>
        <button
          type="button"
          onClick={onSendPhone}
          className="font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            height: '60px',
            padding: '0 24px',
            borderRadius: '8px',
            backgroundColor: '#1796d6',
            color: '#fff',
            fontSize: '18px',
            lineHeight: '18px',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          SEND TO PHONE
        </button>
      </div>
    </div>
  );
}
