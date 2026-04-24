'use client';

interface PermissionGateProps {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
}

/**
 * Overlay mostrado cuando `getUserMedia` falla o el usuario niega el permiso.
 * Render mínimo (no pixel-perfect porque no está en el diseño original);
 * se apoya en tokens `--photo-*` para el branding.
 */
export function PermissionGate({ title, body, retryLabel, onRetry }: PermissionGateProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'hsl(var(--photo-countdown-bg) / 0.75)',
        color: 'hsl(var(--photo-share-title))',
        padding: 96,
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 64, marginBottom: 32 }}>
        {title}
      </h2>
      <p style={{ fontSize: 28, lineHeight: 1.4, maxWidth: 720, marginBottom: 48 }}>{body}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          fontSize: 28,
          padding: '16px 48px',
          borderRadius: 9999,
          border: '3px solid hsl(var(--photo-cta-border))',
          color: 'hsl(var(--photo-cta-text))',
          background: 'transparent',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
        }}
      >
        {retryLabel}
      </button>
    </div>
  );
}
