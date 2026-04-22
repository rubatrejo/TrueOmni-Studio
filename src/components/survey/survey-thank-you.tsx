'use client';

import { useEffect, useState } from 'react';

interface Props {
  title: string;
  message: string;
  countdownTemplate: string;
  autoCloseMs: number;
  onAutoClose: () => void;
}

/**
 * Pantalla de cierre cinematic. Check con animación stroke-draw, halo que se
 * expande, copy grande, countdown + progress bar olive.
 */
export function SurveyThankYou({
  title,
  message,
  countdownTemplate,
  autoCloseMs,
  onAutoClose,
}: Props) {
  const totalSec = Math.ceil(autoCloseMs / 1000);
  const [remaining, setRemaining] = useState(totalSec);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    const timeout = setTimeout(onAutoClose, autoCloseMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [autoCloseMs, onAutoClose]);

  const progress = ((totalSec - remaining) / totalSec) * 100;

  return (
    <div
      className="survey-step-anim flex flex-col items-center"
      style={{ gap: '40px', maxWidth: '640px' }}
    >
      {/* Check animado con halo expand. Círculo blanco + palomita lime. */}
      <div className="relative flex items-center justify-center" style={{ height: '180px' }}>
        <span
          aria-hidden
          className="survey-halo absolute rounded-full"
          style={{
            width: '180px',
            height: '180px',
            backgroundColor: 'hsl(var(--primary-foreground) / 0.5)',
          }}
        />
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: '156px',
            height: '156px',
            backgroundColor: 'hsl(var(--primary-foreground))',
            boxShadow: '0 20px 50px -15px rgba(0,0,0,0.35)',
          }}
        />
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          className="relative"
          aria-hidden
        >
          <polyline
            className="survey-check-path"
            points="5 12 10 17 19 7"
            stroke="hsl(var(--survey-success))"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1
        className="text-center font-display font-bold"
        style={{ fontSize: '56px', lineHeight: 1.08, letterSpacing: '-0.02em' }}
      >
        {title}
      </h1>

      <p
        className="text-center font-sans"
        style={{ fontSize: '22px', lineHeight: 1.45, opacity: 0.85, maxWidth: '560px' }}
      >
        {message}
      </p>

      <div className="flex flex-col items-center" style={{ gap: '14px', marginTop: '8px' }}>
        <p
          className="text-center font-sans font-medium"
          style={{ fontSize: '15px', opacity: 0.7, letterSpacing: '0.04em' }}
        >
          {countdownTemplate.replace('{seconds}', String(remaining))}
        </p>
        <div
          className="overflow-hidden rounded-full"
          style={{
            width: '320px',
            height: '4px',
            backgroundColor: 'hsl(var(--primary-foreground) / 0.18)',
          }}
        >
          <div
            className="h-full transition-all ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: 'color-mix(in oklch, hsl(var(--primary)) 45%, black 55%)',
              transitionDuration: '1000ms',
              boxShadow: '0 0 12px rgba(0,0,0,0.55)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
