'use client';

/**
 * STUB del editor (pantalla 4). La implementación pixel-perfect se hace en
 * la Ola 4 con tabs (Backgrounds/Frames/Filters) + stickers DnD.
 * En Ola 3 solo mostramos la foto compuesta + botón back + botón share
 * para validar el flujo completo.
 */
interface EditorScreenProps {
  blobUrl: string | null;
  onBack: () => void;
  onShare: () => void;
  backLabel: string;
  shareLabel: string;
}

export function EditorScreen({ blobUrl, onBack, onShare, backLabel, shareLabel }: EditorScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'hsl(var(--photo-bg))',
        padding: 64,
        gap: 40,
      }}
    >
      {blobUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt=""
          style={{
            maxWidth: 800,
            maxHeight: 1400,
            borderRadius: 40,
            boxShadow: '0 20px 60px rgb(0 0 0 / 0.3)',
          }}
        />
      ) : null}
      <div style={{ display: 'flex', gap: 24 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '16px 48px',
            fontSize: 28,
            borderRadius: 9999,
            border: '3px solid hsl(var(--photo-text))',
            background: 'transparent',
            color: 'hsl(var(--photo-text))',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }}
        >
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onShare}
          style={{
            padding: '16px 48px',
            fontSize: 28,
            borderRadius: 9999,
            border: 'none',
            background: 'hsl(var(--photo-tabs-bg))',
            color: 'hsl(var(--photo-cta-text))',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }}
        >
          {shareLabel}
        </button>
      </div>
    </div>
  );
}
