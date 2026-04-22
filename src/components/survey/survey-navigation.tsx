'use client';

import type { ReactNode } from 'react';

interface Props {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  backLabel: string;
  nextDisabled?: boolean;
  center?: ReactNode;
}

/**
 * Footer 3 columnas: BACK izquierda · dots centro · NEXT/SEND derecha.
 * BACK invisible (opacity:0) si no hay onBack — preserva el layout simétrico.
 * CTA primario con glow, arrow animado al hover.
 */
export function SurveyNavigation({
  onBack,
  onNext,
  nextLabel,
  backLabel,
  nextDisabled = false,
  center,
}: Props) {
  return (
    <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr', gap: '20px' }}>
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="group inline-flex items-center justify-center rounded-full border-2 font-display font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-0"
          style={{
            borderColor: 'hsl(var(--primary-foreground) / 0.7)',
            height: '64px',
            paddingLeft: '28px',
            paddingRight: '32px',
            fontSize: '16px',
            minWidth: '148px',
            gap: '10px',
          }}
        >
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:-translate-x-1"
          >
            ←
          </span>
          {backLabel}
        </button>
      </div>
      <div className="flex items-center justify-center">{center}</div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="group inline-flex items-center justify-center rounded-full bg-primary-foreground font-display font-bold uppercase tracking-[0.08em] text-primary transition-all duration-200 ease-out hover:scale-[1.02] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{
            height: '64px',
            paddingLeft: '32px',
            paddingRight: '32px',
            fontSize: '16px',
            minWidth: '148px',
            gap: '12px',
            boxShadow:
              '0 12px 32px -8px hsl(var(--primary-foreground) / 0.5), 0 0 0 1px hsl(var(--primary-foreground) / 0.2)',
          }}
        >
          {nextLabel}
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
