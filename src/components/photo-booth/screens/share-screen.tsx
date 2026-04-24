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
 * Pantalla de share (pantalla 5) verbatim del SVG `5-Photo_Booth-Share.png.svg`.
 * - Fondo: foto compuesta fullscreen + gradient overlay oscuro top.
 * - Título "SHARE YOUR MEMORIES" centrado (y=245).
 * - Photo card blanco (x=146, y=311, 788×1353) con la foto final adentro +
 *   branding del cliente y QR + "SCAN ME".
 * - "Follow us" pill (y=1556) con 3 iconos sociales.
 * - Botones EMAIL y TEXT (y=1727).
 * - Home button semicircle (x=0, y=1163).
 */
export function ShareScreen({
  blobUrl,
  qrUrl,
  social,
  onHome,
  onEmail,
  onText,
  labels,
  logoSrc,
  logoAlt,
}: ShareScreenProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ width: 1080, height: 1920, background: 'hsl(var(--photo-share-bg))' }}
    >
      {/* Fondo: foto fullscreen blurred como backdrop */}
      {blobUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(24px) brightness(0.4)',
            transform: 'scale(1.05)',
          }}
        />
      ) : null}

      {/* Gradient top overlay */}
      <svg
        width={1080}
        height={266}
        viewBox="0 0 1080 266"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="pb-share-top" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopOpacity={0.8} />
            <stop offset="1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1080} height={266} fill="url(#pb-share-top)" />
      </svg>

      {/* Título */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 210,
          width: 1080,
          textAlign: 'center',
          color: 'hsl(var(--photo-share-title))',
          fontFamily: "'Titillium Web', 'Open Sans', system-ui",
          fontSize: 57,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        {labels.title}
      </div>

      {/* Photo card blanco */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: 146,
          top: 311,
          width: 788,
          height: 1353,
          background: '#fff',
          borderRadius: 42,
          boxShadow: '0 20px 60px rgb(0 0 0 / 0.4)',
        }}
      >
        {/* Pequeño rect blanco con logo (branding dentro del card, y=323 - 311 = 12 abs interno) */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 12,
            width: 354,
            height: 87,
            borderRadius: 17,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={logoAlt}
            draggable={false}
            style={{ height: 48 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Photo inside card */}
        {blobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt=""
            style={{
              position: 'absolute',
              left: 27,
              top: 25,
              width: 734,
              height: 1307,
              objectFit: 'cover',
              borderRadius: 24,
            }}
          />
        ) : null}
      </div>

      {/* QR code badge — sibling del photo card para que renderice sobre
          el Follow us pill (z-order superior). Coords abs del SVG:
          translate(717.96, 1420.373 + 27.345) + mask inner padding. */}
      <div
        className="absolute"
        style={{
          left: 699,
          top: 1398,
          width: 236,
          height: 286,
          borderRadius: 10,
          background: '#0088ce',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          color: '#fff',
          zIndex: 10,
          boxShadow: '0 8px 20px rgb(0 0 0 / 0.3)',
        }}
      >
        <div
          style={{
            width: 204,
            height: 204,
            background: '#fff',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QRCodeSVG value={qrUrl} size={184} level="H" includeMargin={false} />
        </div>
        <div
          style={{
            fontSize: 28,
            fontFamily: "'Open Sans', system-ui",
            fontWeight: 700,
          }}
        >
          {labels.scanMe}
        </div>
      </div>

      {/* Follow us pill */}
      <div
        className="absolute flex items-center"
        style={{
          left: 148,
          top: 1556,
          width: 601,
          height: 106,
          borderRadius: 38,
          background: '#fff',
          padding: '0 48px',
          gap: 48,
          color: 'hsl(var(--photo-text))',
          fontFamily: "'Titillium Web', 'Open Sans', system-ui",
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        <span>{labels.follow}</span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginLeft: 'auto' }}>
          {/* X / Twitter */}
          {social?.x ? (
            <svg width={48} height={48} viewBox="0 0 60 60" aria-hidden="true">
              <path
                d="M14 8L30 28L46 8H52L34 31L54 56H42L28 38L14 56H8L26 32L8 8Z"
                fill="#000"
              />
            </svg>
          ) : null}
          {/* Facebook */}
          {social?.facebook ? (
            <svg width={60} height={60} viewBox="0 0 60 60" aria-hidden="true">
              <rect width={60} height={60} rx={10} fill="#1976d2" />
              <path
                d="M38 20h-5v-4c0-2 1-2 3-2h3V7h-5a8 8 0 00-8 8v5h-4v7h4v20h7V27h4z"
                fill="#fff"
              />
            </svg>
          ) : null}
          {/* Instagram */}
          {social?.instagram ? (
            <svg width={60} height={60} viewBox="0 0 60 60" aria-hidden="true">
              <defs>
                <linearGradient id="ig-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f09433" />
                  <stop offset="0.5" stopColor="#e6683c" />
                  <stop offset="1" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <rect width={60} height={60} rx={14} fill="url(#ig-grad)" />
              <circle cx={30} cy={30} r={12} fill="none" stroke="#fff" strokeWidth={4} />
              <circle cx={44} cy={16} r={3} fill="#fff" />
            </svg>
          ) : null}
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
          border: '5px solid hsl(var(--photo-cta-border))',
          background: 'transparent',
          color: 'hsl(var(--photo-cta-text))',
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
          <rect x={1.5} y={1.5} width={45} height={33} rx={6} stroke="#fff" strokeWidth={2} fill="none" />
          <path d="M3 3l21 18L45 3" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
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
          border: '5px solid hsl(var(--photo-cta-border))',
          background: 'transparent',
          color: 'hsl(var(--photo-cta-text))',
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
            stroke="#fff"
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
          />
          <line x1={10} y1={12} x2={32} y2={12} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <line x1={10} y1={20} x2={32} y2={20} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <span>{labels.textCta}</span>
      </button>

      {/* Home button (semicircle left, alineado a top:1000 con
          FloatingHomeButton del resto del kiosk). */}
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
