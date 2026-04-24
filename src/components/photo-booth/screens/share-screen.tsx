'use client';

import { QRCodeSVG } from 'qrcode.react';

import type { PhotoBoothConfig } from '@/lib/config';

interface ShareScreenProps {
  blobUrl: string | null;
  /** URL que se codifica en el QR (v1 placeholder). */
  qrUrl: string;
  social?: PhotoBoothConfig['social'];
  /** Imagen de fondo fullscreen (1080×1920) configurable desde el CMS. */
  shareBackgroundSrc?: string;
  onHome: () => void;
  onEmail: () => void;
  onText: () => void;
  labels: {
    title: string;
    follow: string;
    emailCta: string;
    textCta: string;
    scanMe: string;
    ariaHome: string;
  };
  logoSrc: string;
  logoAlt: string;
}

/**
 * Pantalla 5-Share del Photo Booth.
 *
 * Layout:
 *   - Fondo blanco completo (sin foto blurred al fondo).
 *   - Header: logo + weather/clock (vienen del módulo padre vía
 *     `KioskHeader`, no se renderizan aquí).
 *   - Título "SHARE YOUR MEMORIES".
 *   - Photo card blanco con la foto final adentro.
 *   - "Follow us" pill ANCHO con iconos sociales A LA IZQUIERDA y QR
 *     code blanco INTEGRADO a la derecha (no sobre el photo card).
 *   - Botones EMAIL y TEXT.
 *   - Home button semicircle izquierda.
 */
export function ShareScreen({
  blobUrl,
  qrUrl,
  social,
  shareBackgroundSrc,
  onHome,
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
      {/* Gradient overlay top-bottom para legibilidad del título y CTAs */}
      <div
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.75) 100%)',
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

      {/* Photo card 9:16 — match aspect de la captura para evitar crop. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: 220,
          top: 340,
          width: 640,
          height: 1100,
          background: '#fff',
          borderRadius: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        {blobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : null}
      </div>

      {/* Follow us pill ancho con iconos sociales oficiales + QR integrado */}
      <div
        className="absolute flex items-center"
        style={{
          left: 80,
          top: 1470,
          width: 920,
          height: 180,
          borderRadius: 90,
          background: '#ffffff',
          boxShadow: '0 14px 40px rgba(0,0,0,0.30)',
          padding: '0 24px 0 56px',
          gap: 28,
        }}
      >
        <span
          style={{
            color: '#000',
            fontFamily: "'Open Sans', system-ui",
            fontSize: 38,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {labels.follow}
        </span>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {/* X (Twitter) — logo oficial verbatim */}
          {social?.x ? (
            <svg width={64} height={64} viewBox="0 0 1200 1227" aria-hidden="true">
              <path
                d="M714.163 519.284 1160.89 0H1055.03L667.137 450.887 357.328 0H0L468.492 681.821 0 1226.37H105.866L515.491 750.218 842.672 1226.37H1200L714.137 519.284h.026ZM569.165 687.828l-47.469-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
                fill="#000"
              />
            </svg>
          ) : null}
          {/* Facebook — logo oficial f */}
          {social?.facebook ? (
            <svg width={64} height={64} viewBox="0 0 1024 1024" aria-hidden="true">
              <circle cx={512} cy={512} r={512} fill="#1877F2" />
              <path
                d="M712 670l22-141H601V438c0-39 19-77 80-77h62V241s-56-10-110-10c-112 0-186 68-186 191v108H324v141h123v341a512 512 0 00154 0V670h111z"
                fill="#fff"
              />
            </svg>
          ) : null}
          {/* Instagram — logo oficial cámara */}
          {social?.instagram ? (
            <svg width={64} height={64} viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <radialGradient id="ig-grad-real" cx="0.3" cy="1.05" r="1.4">
                  <stop offset="0" stopColor="#fdf497" />
                  <stop offset="0.05" stopColor="#fdf497" />
                  <stop offset="0.45" stopColor="#fd5949" />
                  <stop offset="0.6" stopColor="#d6249f" />
                  <stop offset="0.9" stopColor="#285AEB" />
                </radialGradient>
              </defs>
              <rect x={1.5} y={1.5} width={21} height={21} rx={6} fill="url(#ig-grad-real)" />
              <rect x={4.5} y={4.5} width={15} height={15} rx={4} fill="none" stroke="#fff" strokeWidth={1.4} />
              <circle cx={12} cy={12} r={3.6} fill="none" stroke="#fff" strokeWidth={1.4} />
              <circle cx={17.4} cy={6.6} r={1} fill="#fff" />
            </svg>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <div
            style={{
              width: 132,
              height: 132,
              padding: 8,
              borderRadius: 18,
              background: '#ffffff',
              border: '2px solid hsl(var(--photo-tabs-bg))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QRCodeSVG value={qrUrl} size={116} level="H" includeMargin={false} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontFamily: "'Open Sans', system-ui",
              fontWeight: 700,
              color: 'hsl(var(--photo-tabs-bg))',
              letterSpacing: '0.05em',
            }}
          >
            {labels.scanMe}
          </span>
        </div>
      </div>

      {/* Send to Email button — patrón listing-style (sin icono interno) */}
      <button
        type="button"
        onClick={onEmail}
        className="absolute font-sans"
        style={{
          left: 200,
          top: 1727,
          width: 320,
          height: 86,
          borderRadius: 999,
          border: '2px solid #fff',
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {labels.emailCta}
      </button>

      {/* Send to Phone button */}
      <button
        type="button"
        onClick={onText}
        className="absolute font-sans"
        style={{
          left: 560,
          top: 1727,
          width: 320,
          height: 86,
          borderRadius: 999,
          border: '2px solid #fff',
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {labels.textCta}
      </button>

      {/* Home button (semicircle left, top:1000 alineado al resto) */}
      <button
        type="button"
        aria-label={labels.ariaHome}
        onClick={onHome}
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
        <svg width={54} height={42} viewBox="0 0 54 42" aria-hidden="true">
          <path
            d="M33.6,42.08h0a1.391,1.391,0,0,1-1.078-.469,1.65,1.65,0,0,1-.515-1.03v-9c0-.041,0-.081,0-.122a1.278,1.278,0,0,0-.1-.629c-.088-.175-.5-.318-.825-.433a3.363,3.363,0,0,1-.338-.129A1.673,1.673,0,0,0,30,30.08H24a1.464,1.464,0,0,0-1.078.422c-.072.072-.166.149-.266.23-.3.245-.641.522-.641.848v9a1.4,1.4,0,0,1-.329,1.03,2.593,2.593,0,0,0-.166.208.5.5,0,0,1-.52.261H10.9a1.466,1.466,0,0,1-1.078-.422c-.05-.05-.109-.105-.172-.163-.285-.264-.675-.626-.675-.985v-15.4L26.25,10.955a1.595,1.595,0,0,1,1.5,0L45,25.04V40.509c0,.338-.342.635-.618.874-.083.072-.162.14-.226.2a1.469,1.469,0,0,1-1.078.421Zm16.931-16.5a1.019,1.019,0,0,1-.751-.282L27.75,7.111a1.595,1.595,0,0,0-1.5,0L4.218,25.3a.9.9,0,0,1-.656.282,1.157,1.157,0,0,1-.937-.469L.281,22.2A.9.9,0,0,1,0,21.549a1.278,1.278,0,0,1,.375-.938l23.719-19.5A4.612,4.612,0,0,1,27,.08a4.245,4.245,0,0,1,2.813,1.031l9.161,6.938V1.205c0-.041,0-.081,0-.121a.833.833,0,0,1,.182-.677A1.174,1.174,0,0,1,39.962,0h3.923a1.089,1.089,0,0,1,.8.328,1.089,1.089,0,0,1,.328.8L45,13.977l8.62,6.634a1.278,1.278,0,0,1,.375.938.9.9,0,0,1-.282.656l-2.344,2.906A1.078,1.078,0,0,1,50.531,25.58Z"
            fill="#fff"
          />
        </svg>
      </button>
    </div>
  );
}
