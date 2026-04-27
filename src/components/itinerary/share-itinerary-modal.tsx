'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

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
  /** Path/URL del logo TrueOmni mostrado debajo del QR. Si falta, se omite. */
  poweredByLogo?: string;
  onSendPhone: () => void;
  onSendEmail: () => void;
  onClose: () => void;
}

/**
 * Modal "You made it!" del Itinerary Builder. Card centrada con título + body
 * + QR + "Powered by TrueOmni" + 2 CTAs (Send to Phone olive, Send to Email
 * azul). Pixel-close al SVG `Itinerary Builder - Share_Itinerary.svg`.
 */
export function ShareItineraryModal(props: ShareItineraryModalProps) {
  const { textos, qrUrl, poweredByLogo, onSendPhone, onSendEmail, onClose } = props;

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={textos.title}
    >
      <div className="absolute inset-0 bg-black/55" onPointerDown={onClose} aria-hidden="true" />
      <div className="relative flex w-[760px] flex-col items-center rounded-[28px] bg-white px-12 py-10 shadow-2xl">
        <h2 className="text-center text-[34px] font-bold text-foreground">{textos.title}</h2>
        <p className="mt-4 max-w-[600px] text-center text-[16px] leading-relaxed text-zinc-600">
          {textos.body}
        </p>
        <div
          className="mt-7 flex flex-col items-center justify-center rounded-[16px] p-3"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          <div className="rounded-[10px] bg-white p-3">
            <QRCodeSVG value={qrUrl} size={210} level="H" includeMargin={false} />
          </div>
          <p className="mt-2 text-[14px] font-bold tracking-widest text-white">
            {textos.scanLabel}
          </p>
        </div>
        {poweredByLogo ? (
          <div className="mt-5 flex items-center gap-2">
            <span
              className="text-[14px] font-bold"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {textos.poweredBy}
            </span>
            <Image
              src={poweredByLogo}
              alt="TrueOmni"
              width={120}
              height={28}
              className="h-[28px] w-auto"
              unoptimized
            />
          </div>
        ) : null}
        <div className="mt-7 flex gap-4">
          <button
            type="button"
            onClick={onSendPhone}
            className="flex h-[56px] items-center justify-center rounded-md px-8 text-[15px] font-bold tracking-wider text-white shadow-md"
            style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
          >
            {textos.sendPhone}
          </button>
          <button
            type="button"
            onClick={onSendEmail}
            className="flex h-[56px] items-center justify-center rounded-md px-8 text-[15px] font-bold tracking-wider text-white shadow-md"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            {textos.sendEmail}
          </button>
        </div>
      </div>
    </div>
  );
}
