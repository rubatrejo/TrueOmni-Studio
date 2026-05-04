'use client';

import { useEffect, useRef } from 'react';

import type { HomeMapModule } from '@/lib/config';

export const MAP_WELCOME_STORAGE_KEY = 'kiosk_map_welcome_seen';

interface MapWelcomePopupProps {
  copy: NonNullable<HomeMapModule['welcomeCopy']>;
  onDismiss: () => void;
}

/**
 * Welcome popup "Welcome to Omni Maps". Overlay dentro del canvas con
 * backdrop `rgba(0,0,0,0.6)` + card centrada. El gate (sessionStorage) lo
 * maneja el parent `MapModule`.
 *
 * Paths/layout: `designs/Map/Maps-Welcome-PopUp.svg`.
 */
export function MapWelcomePopup({ copy, onDismiss }: MapWelcomePopupProps) {
  const okRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    okRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-welcome-title"
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="relative overflow-hidden rounded-[18px] bg-white"
        style={{
          width: '900px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        }}
      >
        {/* Tab azul superior */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            backgroundColor: 'hsl(var(--brand-primary))',
            padding: '60px 32px 48px',
          }}
        >
          <h2
            id="map-welcome-title"
            style={{
              fontFamily: "'Open Sans', var(--font-sans)",
              fontSize: '42px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '0.01em',
              textAlign: 'center',
            }}
          >
            {copy.title}
          </h2>
          {copy.subtitle ? (
            <p
              style={{
                fontFamily: "'Open Sans', var(--font-sans)",
                fontSize: '18px',
                color: 'rgba(255,255,255,0.9)',
                margin: '12px 0 0',
                textAlign: 'center',
              }}
            >
              {copy.subtitle}
            </p>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex flex-col items-center" style={{ padding: '52px 56px 52px' }}>
          <p
            style={{
              fontFamily: "'Open Sans', var(--font-sans)",
              fontSize: '24px',
              lineHeight: 1.5,
              color: '#333',
              textAlign: 'center',
              margin: 0,
              maxWidth: '700px',
            }}
          >
            {copy.body}
          </p>

          <button
            ref={okRef}
            type="button"
            onClick={onDismiss}
            className="mt-10 rounded-[10px] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            style={{
              backgroundColor: 'hsl(var(--brand-secondary))',
              color: '#ffffff',
              padding: '20px 80px',
              fontFamily: "'Open Sans', var(--font-sans)",
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              minWidth: '220px',
            }}
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
