'use client';

import { QRCodeSVG } from 'qrcode.react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

export interface ShareItineraryModalTextos {
  title: string;
  body: string;
  scanLabel: string;
  poweredBy: string;
  sendPhone: string;
  sendEmail: string;
  closeAria?: string;
}

export interface ShareItineraryModalProps {
  textos: ShareItineraryModalTextos;
  /** URL codificada en el QR. v1 = placeholder. */
  qrUrl: string;
  onSendPhone: () => void;
  onSendEmail: () => void;
  onClose: () => void;
}

/**
 * Modal "You made it!" del Trip Builder. Card centrada con título + body
 * + QR + "Powered by TrueOmni" + 2 CTAs (Send to Phone olive, Send to Email
 * azul). Pixel-close al SVG `Trip Builder - Share_Itinerary.svg`.
 */
export function ShareItineraryModal(props: ShareItineraryModalProps) {
  const { textos, qrUrl, onSendPhone, onSendEmail, onClose } = props;

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={textos.title}
    >
      <div className="absolute inset-0 bg-black/55" onPointerDown={onClose} aria-hidden="true" />
      <div className="relative flex w-[820px] flex-col items-center rounded-[28px] bg-white px-14 py-12 shadow-2xl">
        <h2 className="text-center text-[52px] font-bold leading-tight text-foreground">
          {textos.title}
        </h2>
        <p className="mt-5 max-w-[640px] text-center text-[26px] leading-relaxed text-black">
          {textos.body}
        </p>
        <div
          className="mt-8 flex flex-col items-center justify-center rounded-[16px] p-3"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          <div className="rounded-[10px] bg-white p-3">
            <QRCodeSVG value={qrUrl} size={220} level="H" includeMargin={false} />
          </div>
          <p className="mt-2 text-[15px] font-bold tracking-widest text-white">
            {textos.scanLabel}
          </p>
        </div>
        <div className="mt-7 flex items-center gap-4" style={{ color: 'hsl(var(--primary))' }}>
          <span className="text-[18px] font-bold">{textos.poweredBy}</span>
          <TrueOmniLogo slot="brand" className="h-[38px] w-auto" />
        </div>
        <div className="mt-12 flex gap-4">
          <button
            type="button"
            onClick={onSendPhone}
            className="flex h-[64px] items-center justify-center rounded-md px-10 text-[16px] font-bold tracking-wider text-white shadow-md"
            style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
          >
            {textos.sendPhone}
          </button>
          <button
            type="button"
            onClick={onSendEmail}
            className="flex h-[64px] items-center justify-center rounded-md px-10 text-[16px] font-bold tracking-wider text-white shadow-md"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            {textos.sendEmail}
          </button>
        </div>
      </div>
    </div>
  );
}
