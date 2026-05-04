'use client';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { GuestbookCountry } from '@/lib/config';

/**
 * Overlay de selección de país. Centrado sobre el form con lista scrollable.
 */
export function GuestbookCountryDropdown({
  open,
  countries,
  selected,
  title,
  onSelect,
  onCancel,
}: {
  open: boolean;
  countries: readonly GuestbookCountry[];
  selected: GuestbookCountry | null;
  title: string;
  onSelect: (country: GuestbookCountry) => void;
  onCancel: () => void;
}) {
  useEscapeToClose(open, onCancel);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestbook-country-title"
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
    >
      <button
        type="button"
        aria-label="Cerrar selección"
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        tabIndex={-1}
      />
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '640px',
          maxHeight: '1100px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 24px 56px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #e8e8e8',
          }}
        >
          <h2
            id="guestbook-country-title"
            className="font-sans"
            style={{
              fontSize: '22px',
              lineHeight: '22px',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCancel}
            className="flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #c7c7c7',
              backgroundColor: '#ffffff',
              color: '#4a4a4a',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M6 6l12 12M18 6l-12 12"
                stroke="#4a4a4a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto" style={{ maxHeight: '900px' }}>
          {countries.map((c) => {
            const isSelected = selected?.code === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => onSelect(c)}
                aria-pressed={isSelected}
                className="flex w-full items-center justify-between font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-300"
                style={{
                  padding: '18px 28px',
                  backgroundColor: isSelected ? '#eef6fc' : '#ffffff',
                  color: isSelected ? 'hsl(var(--brand-primary))' : '#1a1a1a',
                  fontSize: '20px',
                  lineHeight: '20px',
                  fontWeight: isSelected ? 700 : 500,
                  borderBottom: '1px solid #f0f0f0',
                  textAlign: 'left',
                }}
              >
                <span>{c.name}</span>
                {isSelected ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M5 12l5 5 9-11"
                      fill="none"
                      stroke="hsl(var(--brand-primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
