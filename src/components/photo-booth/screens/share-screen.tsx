'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface SocialHandles {
  x?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

interface ShareScreenProps {
  blobUrl: string | null;
  /** URL que se codifica en el QR (v1 placeholder). */
  qrUrl: string;
  /** Imagen de fondo fullscreen (1080×1920) configurable desde el CMS. */
  shareBackgroundSrc?: string;
  /** Handles de redes sociales (configurables en Studio). */
  social?: SocialHandles;
  /** Vuelve a la pantalla de edición (sin warning). */
  onBack: () => void;
  onEmail: () => void;
  onText: () => void;
  labels: {
    title: string;
    emailCta: string;
    textCta: string;
    scanKicker: string;
    ariaBack: string;
  };
  logoSrc: string;
  logoAlt: string;
}

type SocialNetwork = 'instagram' | 'tiktok' | 'facebook' | 'x' | 'youtube';

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
};

/** Devuelve URL completa de la red dado un handle (con o sin @). */
function buildSocialUrl(network: SocialNetwork, handle: string): string {
  const clean = handle.replace(/^@/, '').trim();
  switch (network) {
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'tiktok':
      return `https://tiktok.com/@${clean}`;
    case 'facebook':
      return `https://facebook.com/${clean}`;
    case 'x':
      return `https://x.com/${clean}`;
    case 'youtube':
      return `https://youtube.com/@${clean}`;
  }
}

/** SVG inline de logo de red social — fill="currentColor". */
function SocialIcon({ network }: { network: SocialNetwork }) {
  const SIZE = 42;
  if (network === 'instagram') {
    return (
      <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.2.06 1.8.25 2.2.41.6.22 1 .49 1.4.91.4.4.7.8.9 1.4.16.4.35 1 .4 2.2.07 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.05 1.2-.24 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.16-1 .35-2.2.4-1.2.07-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.2-.05-1.8-.24-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.16-.4-.35-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.05-1.2.24-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.16 1-.35 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 2C8.84 4.2 8.5 4.21 7.3 4.27c-1.1.05-1.7.23-2.1.39-.5.2-.9.44-1.3.84s-.64.8-.84 1.3c-.16.4-.34 1-.39 2.1C2.61 9.5 2.6 9.84 2.6 12s.01 2.5.07 3.7c.05 1.1.23 1.7.39 2.1.2.5.44.9.84 1.3s.8.64 1.3.84c.4.16 1 .34 2.1.39 1.2.06 1.54.07 4.7.07s3.5-.01 4.7-.07c1.1-.05 1.7-.23 2.1-.39.5-.2.9-.44 1.3-.84s.64-.8.84-1.3c.16-.4.34-1 .39-2.1.06-1.2.07-1.54.07-4.7s-.01-3.5-.07-4.7c-.05-1.1-.23-1.7-.39-2.1-.2-.5-.44-.9-.84-1.3s-.8-.64-1.3-.84c-.4-.16-1-.34-2.1-.39C15.5 4.21 15.16 4.2 12 4.2zm0 3.2a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zm0 7.6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5.85-7.78a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0z" />
      </svg>
    );
  }
  if (network === 'tiktok') {
    return (
      <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-.7 4.5 4.5 0 0 1-1.4-2.62V2h-3.5v13.6c0 1.34-1.1 2.42-2.45 2.42a2.45 2.45 0 0 1 0-4.9c.27 0 .53.05.78.13v-3.6a6.05 6.05 0 0 0-.78-.05A6.05 6.05 0 1 0 13.7 15.6V8.85a7.7 7.7 0 0 0 4.5 1.45V6.75a4.4 4.4 0 0 1-1.6-.93z" />
      </svg>
    );
  }
  if (network === 'facebook') {
    return (
      <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.27c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.34V22A10 10 0 0 0 22 12.06z" />
      </svg>
    );
  }
  if (network === 'x') {
    return (
      <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.965 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zM17.083 19.77h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  // youtube
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6z" />
    </svg>
  );
}

/** Modal QR centrado para abrir red social en el móvil del visitante. */
function SocialQrModal({
  network,
  url,
  onClose,
}: {
  network: SocialNetwork;
  url: string;
  onClose: () => void;
}) {
  // Escape capturado a nivel de window para no acoplar listeners a un
  // elemento no-interactivo (rule jsx-a11y/no-noninteractive-element-interactions).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      {/* Backdrop como botón invisible para no romper a11y. El click cierra
          y Escape via onKeyDown del modal de abajo. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'default',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 720,
          background: '#fff',
          borderRadius: 24,
          padding: '60px 60px 50px',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            margin: '0 auto 20px',
            color: 'hsl(var(--brand-secondary))',
          }}
        >
          <SocialIcon network={network} />
        </div>
        <h2
          style={{
            fontFamily: "'Titillium Web', 'Open Sans', system-ui",
            fontSize: 48,
            fontWeight: 700,
            color: '#111',
            margin: '0 0 12px',
          }}
        >
          {SOCIAL_LABELS[network]}
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#666',
            margin: '0 0 32px',
          }}
        >
          Scan to open
        </p>
        <div
          style={{
            display: 'inline-block',
            padding: 24,
            background: '#fff',
            border: '4px solid #e6e8eb',
            borderRadius: 16,
          }}
        >
          <QRCodeSVG value={url} size={420} level="M" includeMargin={false} />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'block',
            margin: '32px auto 0',
            padding: '16px 64px',
            fontSize: 24,
            fontWeight: 700,
            color: '#fff',
            background: 'hsl(var(--brand-secondary))',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

/**
 * Pantalla 5-Share del Photo Booth.
 *
 * Layout:
 *   - Fondo configurable + capa negra 50% para legibilidad.
 *   - Header: logo + weather/clock (vienen del módulo padre vía
 *     `KioskHeader`, no se renderizan aquí).
 *   - Título "SHARE YOUR MEMORIES".
 *   - Photo card blanco con la foto final adentro.
 *   - QR card centrado con "SCAN ME" grande.
 *   - Botones EMAIL y TEXT.
 *   - Home button semicircle izquierda.
 */
export function ShareScreen({
  blobUrl,
  qrUrl,
  shareBackgroundSrc,
  social,
  onBack,
  onEmail,
  onText,
  labels,
  logoSrc: _logoSrc,
  logoAlt: _logoAlt,
}: ShareScreenProps) {
  const [openNetwork, setOpenNetwork] = useState<SocialNetwork | null>(null);
  // Lista ordenada de redes habilitadas (con handle no-vacío).
  const enabledNetworks: SocialNetwork[] = (
    ['instagram', 'tiktok', 'facebook', 'x', 'youtube'] as SocialNetwork[]
  ).filter((n) => social?.[n] && social[n]!.trim().length > 0);
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ width: 1080, height: 1920, background: '#000' }}
    >
      {/* Fondo configurable desde el CMS del cliente — fullscreen 1080×1920 */}
      {shareBackgroundSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shareBackgroundSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}
      {/* Capa negra uniforme 50% para que el contenido se lea bien
          sobre cualquier background. */}
      <div
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Título "SHARE YOUR MEMORIES" sobre la imagen */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 220,
          width: 1080,
          textAlign: 'center',
          color: '#fff',
          fontFamily: "'Titillium Web', 'Open Sans', system-ui",
          fontSize: 57,
          fontWeight: 700,
          letterSpacing: '0.02em',
          textShadow: '0 4px 16px rgba(0,0,0,0.7)',
        }}
      >
        {labels.title}
      </div>

      {/* Photo card aspect ratio EXACTO 9:16 = mismo aspect del blob para
          evitar cualquier crop. Width 540 → Height 960. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: (1080 - 540) / 2,
          top: 360,
          width: 540,
          height: 960,
          background: '#fff',
          borderRadius: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        {blobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
      </div>

      {/* Scan card — minimal:
          · Título "Scan to Save" arriba.
          · QR centrado abajo con corner brackets viewfinder. */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: (1080 - 252) / 2,
          top: 1380,
          width: 252,
          paddingTop: 24,
          paddingBottom: 24,
          paddingInline: 24,
          borderRadius: 24,
          background: '#ffffff',
          boxShadow: '0 18px 44px rgba(0,0,0,0.32), 0 0 0 4px hsl(var(--brand-tertiary) / 0.18)',
          gap: 18,
        }}
      >
        {/* Título arriba — case respetado del config (p.ej. "Scan to Save") */}
        <span
          style={{
            fontFamily: "'Open Sans', system-ui",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: 'hsl(var(--brand-primary))',
            textAlign: 'center',
          }}
        >
          {labels.scanKicker}
        </span>

        {/* QR + corner brackets viewfinder */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 200, height: 200 }}
        >
          <div style={{ width: 170, height: 170, background: '#ffffff' }}>
            <QRCodeSVG value={qrUrl} size={170} level="H" includeMargin={false} />
          </div>
          {(
            [
              { top: 0, left: 0 },
              { top: 0, right: 0 },
              { bottom: 0, left: 0 },
              { bottom: 0, right: 0 },
            ] as const
          ).map((pos, i) => {
            const isTop = 'top' in pos;
            const isLeft = 'left' in pos;
            return (
              <span
                key={i}
                aria-hidden
                style={{
                  position: 'absolute',
                  width: 26,
                  height: 26,
                  ...(isTop ? { top: 0 } : { bottom: 0 }),
                  ...(isLeft ? { left: 0 } : { right: 0 }),
                  borderColor: 'hsl(var(--photo-tabs-bg))',
                  borderStyle: 'solid',
                  borderWidth: 0,
                  borderTopWidth: isTop ? 4 : 0,
                  borderBottomWidth: !isTop ? 4 : 0,
                  borderLeftWidth: isLeft ? 4 : 0,
                  borderRightWidth: !isLeft ? 4 : 0,
                  borderTopLeftRadius: isTop && isLeft ? 8 : 0,
                  borderTopRightRadius: isTop && !isLeft ? 8 : 0,
                  borderBottomLeftRadius: !isTop && isLeft ? 8 : 0,
                  borderBottomRightRadius: !isTop && !isLeft ? 8 : 0,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Send to Email — pill solid olive (matches "CLEAR ALL" filter style) */}
      <button
        type="button"
        onClick={onEmail}
        className="absolute font-sans"
        style={{
          left: 130,
          top: 1727,
          width: 380,
          height: 86,
          borderRadius: 14,
          border: 'none',
          background: 'hsl(var(--brand-tertiary))',
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
        }}
      >
        {labels.emailCta}
      </button>

      {/* Send to Phone — pill solid azul (matches "APPLY" filter style) */}
      <button
        type="button"
        onClick={onText}
        className="absolute font-sans"
        style={{
          left: 570,
          top: 1727,
          width: 380,
          height: 86,
          borderRadius: 14,
          border: 'none',
          background: 'hsl(var(--brand-secondary))',
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
        }}
      >
        {labels.textCta}
      </button>

      {/* Back button (semicircle izq.) — regresa al editor SIN warning.
          La sesión sigue viva, el usuario puede seguir editando. */}
      <button
        type="button"
        aria-label={labels.ariaBack}
        onClick={onBack}
        className="absolute"
        style={{
          left: 0,
          top: 1000,
          width: 116,
          height: 232,
          padding: 0,
          border: 'none',
          borderTopRightRadius: 116,
          borderBottomRightRadius: 116,
          background: 'hsl(var(--photo-home-btn-bg))',
          boxShadow: '12px 0 28px rgba(0,0,0,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 28,
        }}
      >
        <svg width={45} height={50} viewBox="0 0 45 51" aria-hidden="true">
          <path
            d="M23.489,0a4.559,4.559,0,0,1,2.242,1.624c.65.749,1.334,1.461,2,2.2a3.462,3.462,0,0,1-.015,4.885q-4.87,5.345-9.749,10.68c-.113.124-.221.253-.412.474h.614q11.722,0,23.445-.006A2.855,2.855,0,0,1,44.5,21.67a4.867,4.867,0,0,1,.31,1.708c.04,1.245.005,2.492-.005,3.738-.018,2.132-1.228,3.458-3.18,3.465-2.68.009-5.36,0-8.039,0h-16c.184.215.3.354.415.484q4.851,5.3,9.7,10.592a3.172,3.172,0,0,1,.614,4,27.824,27.824,0,0,1-3.874,4.261,2.455,2.455,0,0,1-3.356-.341c-.114-.106-.224-.217-.33-.333Q10.9,38.462,1.057,27.677a3.427,3.427,0,0,1-.636-4.1A4.415,4.415,0,0,1,1.07,22.7q9.824-10.772,19.651-21.54A4.305,4.305,0,0,1,22.5,0Z"
            fill="#fff"
          />
        </svg>
      </button>

      {/* Grid de iconos sociales habilitados — debajo del CTA Email/Text.
          Click → modal QR centrado con URL de la red. */}
      {enabledNetworks.length > 0 ? (
        <div
          className="absolute"
          style={{
            left: 0,
            right: 0,
            bottom: 80,
            display: 'flex',
            justifyContent: 'center',
            gap: 28,
          }}
        >
          {enabledNetworks.map((network) => (
            <button
              key={network}
              type="button"
              onClick={() => setOpenNetwork(network)}
              aria-label={`Open ${SOCIAL_LABELS[network]}`}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.96)',
                color: 'hsl(var(--brand-secondary))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
              }}
            >
              <SocialIcon network={network} />
            </button>
          ))}
        </div>
      ) : null}

      {openNetwork && social?.[openNetwork] ? (
        <SocialQrModal
          network={openNetwork}
          url={buildSocialUrl(openNetwork, social[openNetwork]!)}
          onClose={() => setOpenNetwork(null)}
        />
      ) : null}
    </div>
  );
}
