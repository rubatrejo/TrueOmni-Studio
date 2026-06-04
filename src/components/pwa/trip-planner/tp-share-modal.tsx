'use client';

import { QRCodeSVG } from 'qrcode.react';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Modal de compartir itinerario: QR + Send to Phone / Send to Email. */
export function TpShareModal({
  textos,
  clientName,
  onClose,
}: {
  textos: Record<string, string>;
  clientName: string;
  onClose: () => void;
}) {
  const fill = (s: string) => s.replaceAll('{client_name}', clientName);
  const qrUrl = 'https://trueomni.com/trip-planner';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      style={OPEN_SANS}
    >
      <div className="relative w-full overflow-hidden rounded-[14px] bg-white px-6 pb-6 pt-8 text-center">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400"
        >
          <svg width={16} height={16} viewBox="0 0 16 16">
            <path
              d="M12.5 3.5l-9 9M3.5 3.5l9 9"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 className="text-[22px] font-extrabold" style={{ color: 'hsl(var(--brand-secondary))' }}>
          {fill(textos.itinerary_share_modal_title ?? 'You made it!')}
        </h2>
        <p className="mx-auto mt-2 max-w-[260px] text-[12px] leading-relaxed text-gray-500">
          {fill(
            textos.itinerary_share_modal_body ??
              'Share your itinerary via email, phone, or scan the QR code.',
          )}
        </p>

        <div
          className="mx-auto my-5 flex h-[150px] w-[150px] items-center justify-center rounded-[12px]"
          style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          <QRCodeSVG value={qrUrl} size={120} bgColor="transparent" fgColor="#ffffff" />
        </div>
        <p className="mb-5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
          {textos.itinerary_share_scan_label ?? 'SCAN ME'}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            className="w-full rounded-full py-3 text-[13px] font-bold uppercase tracking-wide text-white transition-transform active:scale-[0.97]"
            style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
          >
            {textos.itinerary_share_send_phone ?? 'SEND TO PHONE'}
          </button>
          <button
            type="button"
            className="w-full rounded-full py-3 text-[13px] font-bold uppercase tracking-wide text-white transition-transform active:scale-[0.97]"
            style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
          >
            {textos.itinerary_share_send_email ?? 'SEND TO EMAIL'}
          </button>
        </div>
      </div>
    </div>
  );
}
