'use client';

import { useState } from 'react';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const PWA = 'hsl(var(--pwa-primary))';
const SECONDARY = 'hsl(var(--brand-secondary))';
const OPEN_SANS = 'var(--font-open-sans)';

/**
 * Detalle de artículo de Help (`/pwa/help/[slug]`). Header brand (back → Help),
 * título + cuerpo, y footer "Was this answer helpful? YES/NO" que al votar muestra
 * "Thanks for your feedback!". Textos desde `config.features.pwa.help`.
 */
export function HelpArticleScreen({
  headerTitle,
  question,
  answer,
  helpfulPrompt,
  helpfulYes,
  helpfulNo,
  thanks,
}: {
  headerTitle: string;
  question: string;
  answer: string;
  helpfulPrompt: string;
  helpfulYes: string;
  helpfulNo: string;
  thanks: string;
}) {
  const [voted, setVoted] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={headerTitle} backHref="/pwa/help" />
        </div>
      </div>

      {/* Cuerpo scroll */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        <h1
          className="px-6 pb-4 pt-6 text-center font-bold"
          style={{ fontSize: 21, lineHeight: 1.25, color: SECONDARY, fontFamily: OPEN_SANS }}
        >
          {question}
        </h1>
        <div className="border-b" style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }} />
        <p
          className="px-6 py-6 text-foreground"
          style={{ fontSize: 15, lineHeight: 1.6, fontFamily: OPEN_SANS }}
        >
          {answer}
        </p>
      </div>

      {/* Footer helpful / thanks */}
      <div
        className="shrink-0 px-6 py-5"
        style={{ backgroundColor: 'hsl(var(--foreground) / 0.04)' }}
      >
        {voted ? (
          <div
            className="text-center text-foreground/60"
            style={{ fontSize: 14, fontFamily: OPEN_SANS }}
          >
            {thanks}
          </div>
        ) : (
          <>
            <div
              className="mb-3 text-center text-foreground/60"
              style={{ fontSize: 14, fontFamily: OPEN_SANS }}
            >
              {helpfulPrompt}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVoted(true)}
                className="flex-1 rounded-[7px] font-bold text-white"
                style={{ height: 44, backgroundColor: PWA, fontSize: 14, fontFamily: OPEN_SANS }}
              >
                {helpfulYes}
              </button>
              <button
                type="button"
                onClick={() => setVoted(true)}
                className="flex-1 rounded-[7px] font-bold"
                style={{
                  height: 44,
                  border: `1.5px solid ${PWA}`,
                  color: PWA,
                  fontSize: 14,
                  fontFamily: OPEN_SANS,
                }}
              >
                {helpfulNo}
              </button>
            </div>
          </>
        )}
      </div>

      <PwaBottomNav active="more" />
    </div>
  );
}
