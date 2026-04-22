'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  message: string;
  autoCloseMs?: number;
  onAutoClose: () => void;
}

export function PassSentConfirmation({ title, message, autoCloseMs = 3000, onAutoClose }: Props) {
  useEffect(() => {
    const timeout = setTimeout(onAutoClose, autoCloseMs);
    return () => clearTimeout(timeout);
  }, [autoCloseMs, onAutoClose]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div
        className="flex flex-col items-center bg-white"
        style={{
          width: '640px',
          paddingTop: '48px',
          paddingBottom: '48px',
          paddingLeft: '48px',
          paddingRight: '48px',
          borderRadius: '16px',
          gap: '20px',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '120px',
            height: '120px',
            backgroundColor: 'hsl(var(--survey-success))',
            boxShadow: '0 10px 30px -10px hsl(var(--survey-success) / 0.55)',
          }}
          aria-hidden
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <polyline
              points="5 12 10 17 19 7"
              stroke="#ffffff"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          className="text-center font-display font-bold text-foreground"
          style={{ fontSize: '32px', lineHeight: 1.15, letterSpacing: '-0.01em' }}
        >
          {title}
        </h2>
        <p
          className="text-center font-sans text-foreground"
          style={{ fontSize: '18px', lineHeight: 1.45, opacity: 0.7 }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
