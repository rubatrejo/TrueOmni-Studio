'use client';

import { QRCodeSVG } from 'qrcode.react';

import type { PhotoBoothConfig } from '@/lib/config';

interface ShareScreenProps {
  blobUrl: string | null;
  /** URL que se codifica en el QR (v1 placeholder). */
  qrUrl: string;
  social?: PhotoBoothConfig['social'];
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
      style={{ width: 1080, height: 1920, background: '#ffffff' }}
    >
      {/* Banda azul superior 397px que matches el gradient del KioskHeader
          (proporciona base oscura para el logo+weather blancos del header). */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: 0,
          top: 0,
          width: 1080,
          height: 397,
          background: 'hsl(var(--photo-tabs-bg))',
        }}
      />

      {/* Título — debajo del header (logo+weather y=40-100) */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 440,
          width: 1080,
          textAlign: 'center',
          color: 'hsl(var(--photo-tabs-bg))',
          fontFamily: "'Titillium Web', 'Open Sans', system-ui",
          fontSize: 57,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        {labels.title}
      </div>

      {/* Photo card (centrado, con sombra suave) */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: 146,
          top: 540,
          width: 788,
          height: 900,
          background: '#fff',
          borderRadius: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {blobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      {/* Follow us pill ancho con iconos + QR integrado */}
      <div
        className="absolute flex items-center"
        style={{
          left: 80,
          top: 1470,
          width: 920,
          height: 180,
          borderRadius: 90,
          background: '#ffffff',
          boxShadow: '0 14px 40px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.05)',
          padding: '0 24px 0 56px',
          gap: 24,
        }}
      >
        <span
          style={{
            color: 'hsl(var(--photo-text))',
            fontFamily: "'Titillium Web', 'Open Sans', system-ui",
            fontSize: 42,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {labels.follow}
        </span>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {/* X / Twitter */}
          {social?.x ? (
            <svg width={56} height={56} viewBox="0 0 60 60" aria-hidden="true">
              <path
                d="M14 8L30 28L46 8H52L34 31L54 56H42L28 38L14 56H8L26 32L8 8Z"
                fill="#000"
              />
            </svg>
          ) : null}
          {/* Facebook */}
          {social?.facebook ? (
            <svg width={56} height={56} viewBox="0 0 60 60" aria-hidden="true">
              <rect width={60} height={60} rx={10} fill="#1976d2" />
              <path
                d="M38 20h-5v-4c0-2 1-2 3-2h3V7h-5a8 8 0 00-8 8v5h-4v7h4v20h7V27h4z"
                fill="#fff"
              />
            </svg>
          ) : null}
          {/* Instagram */}
          {social?.instagram ? (
            <svg width={56} height={56} viewBox="0 0 60 60" aria-hidden="true">
              <defs>
                <linearGradient id="ig-grad-share" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f09433" />
                  <stop offset="0.5" stopColor="#e6683c" />
                  <stop offset="1" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <rect width={60} height={60} rx={14} fill="url(#ig-grad-share)" />
              <circle cx={30} cy={30} r={12} fill="none" stroke="#fff" strokeWidth={4} />
              <circle cx={44} cy={16} r={3} fill="#fff" />
            </svg>
          ) : null}
        </div>

        {/* Spacer + QR embebido en el pill */}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
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
              fontSize: 16,
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

      {/* EMAIL button */}
      <button
        type="button"
        onClick={onEmail}
        className="absolute"
        style={{
          left: 281,
          top: 1727,
          width: 247,
          height: 86,
          borderRadius: 13,
          border: '5px solid hsl(var(--photo-tabs-bg))',
          background: '#fff',
          color: 'hsl(var(--photo-tabs-bg))',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 32,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <svg width={48} height={36} viewBox="0 0 48 36" aria-hidden="true">
          <rect
            x={1.5}
            y={1.5}
            width={45}
            height={33}
            rx={6}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
          />
          <path
            d="M3 3l21 18L45 3"
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <span>{labels.emailCta}</span>
      </button>

      {/* TEXT button */}
      <button
        type="button"
        onClick={onText}
        className="absolute"
        style={{
          left: 553,
          top: 1727,
          width: 247,
          height: 86,
          borderRadius: 13,
          border: '5px solid hsl(var(--photo-tabs-bg))',
          background: '#fff',
          color: 'hsl(var(--photo-tabs-bg))',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 32,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <svg width={42} height={38} viewBox="0 0 42 38" aria-hidden="true">
          <path
            d="M5 3h32a4 4 0 014 4v18a4 4 0 01-4 4H15l-8 6v-6H5a4 4 0 01-4-4V7a4 4 0 014-4z"
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
          />
          <line
            x1={10}
            y1={12}
            x2={32}
            y2={12}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line
            x1={10}
            y1={20}
            x2={32}
            y2={20}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
        <span>{labels.textCta}</span>
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
