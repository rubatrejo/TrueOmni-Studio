'use client';

import { QRCodeSVG } from 'qrcode.react';

interface ShareScreenProps {
  blobUrl: string | null;
  /** URL que se codifica en el QR (v1 placeholder). */
  qrUrl: string;
  /** Imagen de fondo fullscreen (1080×1920) configurable desde el CMS. */
  shareBackgroundSrc?: string;
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
  onBack,
  onEmail,
  onText,
  labels,
  logoSrc: _logoSrc,
  logoAlt: _logoAlt,
}: ShareScreenProps) {
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
          boxShadow:
            '0 18px 44px rgba(0,0,0,0.32), 0 0 0 4px rgba(185,189,57,0.18)',
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
            color: '#0b3a66',
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
          {([
            { top: 0, left: 0 },
            { top: 0, right: 0 },
            { bottom: 0, left: 0 },
            { bottom: 0, right: 0 },
          ] as const).map((pos, i) => {
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
          background: '#b9bd39',
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
          background: '#1796d6',
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
    </div>
  );
}
