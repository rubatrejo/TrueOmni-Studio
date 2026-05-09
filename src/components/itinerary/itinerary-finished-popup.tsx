'use client';

import { useEffect, useState } from 'react';

export interface ItineraryFinishedPopupProps {
  title: string;
  body: string;
  /** Auto-cierra después de N ms. Default 4000. */
  autoCloseMs?: number;
  onClose: () => void;
}

/**
 * Popup de confirmación estilo Survey thank-you. Aparece tras pulsar Finish
 * en el Final Result del AI: muestra check verde olive + título + body, con
 * barra de progreso del auto-close.
 */
export function ItineraryFinishedPopup(props: ItineraryFinishedPopupProps) {
  const total = props.autoCloseMs ?? 4000;
  const [remaining, setRemaining] = useState(total);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        props.onClose();
      }
    }, 60);
    return () => clearInterval(interval);
  }, [total, props]);

  const progressPct = ((total - remaining) / total) * 100;

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div className="relative flex w-[640px] flex-col items-center rounded-[24px] bg-white px-10 py-10 shadow-2xl">
        <div
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full"
          style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 12l5 5 9-9"
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mt-5 text-center text-[28px] font-bold text-foreground">{props.title}</h2>
        <p className="mt-3 text-center text-[16px] leading-relaxed text-zinc-700">{props.body}</p>
        <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-zinc-200">
          <span
            className="block h-full"
            style={{
              width: `${progressPct}%`,
              backgroundColor: 'hsl(var(--itinerary-olive))',
              transition: 'width 60ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}
