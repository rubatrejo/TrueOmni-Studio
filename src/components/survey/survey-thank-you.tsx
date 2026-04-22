'use client';

import { useEffect, useState } from 'react';

interface Props {
  title: string;
  message: string;
  countdownTemplate: string; // ej. "Returning home in {seconds}s..."
  autoCloseMs: number;
  onAutoClose: () => void;
}

/**
 * Pantalla final: check animado + countdown descendente + auto-close.
 * Reemplaza al último paso del survey cuando el dispatch ya se ejecutó.
 */
export function SurveyThankYou({
  title,
  message,
  countdownTemplate,
  autoCloseMs,
  onAutoClose,
}: Props) {
  const [remaining, setRemaining] = useState(Math.ceil(autoCloseMs / 1000));

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

  const totalSeconds = Math.ceil(autoCloseMs / 1000);
  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

  return (
    <div
      className="flex flex-col items-center"
      style={{ paddingTop: '24px', paddingBottom: '24px' }}
    >
      <div
        className="mb-8 flex items-center justify-center rounded-full bg-accent"
        style={{
          width: '120px',
          height: '120px',
          boxShadow: '0 0 0 8px hsl(var(--accent) / 0.25)',
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="hsl(var(--accent-foreground))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="5 12 10 17 19 7" />
        </svg>
      </div>
      <h2 className="mb-3 text-center font-display font-bold" style={{ fontSize: '44px' }}>
        {title}
      </h2>
      <p
        className="mb-6 text-center font-sans"
        style={{ fontSize: '22px', opacity: 0.9, maxWidth: '640px' }}
      >
        {message}
      </p>
      <p className="text-center font-sans" style={{ fontSize: '18px', opacity: 0.65 }}>
        {countdownTemplate.replace('{seconds}', String(remaining))}
      </p>
      <div
        className="mt-6 overflow-hidden rounded-full bg-primary-foreground/20"
        style={{ width: '320px', height: '6px' }}
      >
        <div
          className="h-full bg-accent transition-all ease-linear"
          style={{ width: `${progress}%`, transitionDuration: '1000ms' }}
        />
      </div>
    </div>
  );
}
