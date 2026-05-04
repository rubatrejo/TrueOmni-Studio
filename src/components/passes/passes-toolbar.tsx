'use client';

/**
 * Toolbar del módulo Passes — mismo chrome que la toolbar de Listings
 * (categoría "Things to Do"), pero simplificada a 2 cells:
 *   - Cell 1 (0..880) — label "Passes" font-sans 36px padding-left 32.5, bg hsl(var(--brand-primary)).
 *   - Cell 2 (880..1080) — search icon 56×56 filled verbatim del SVG, bg hsl(var(--brand-primary)).
 *   - Divider vertical white 1px en x=880.91.
 */

interface Props {
  label: string;
  onSearchOpen: () => void;
  searchAriaLabel: string;
}

export function PassesToolbar({ label, onSearchOpen, searchAriaLabel }: Props) {
  return (
    <div className="relative" style={{ height: '118px', width: '1080px', flexShrink: 0 }}>
      {/* Cell 1 (label) */}
      <div
        className="absolute left-0 top-0 flex items-center"
        style={{ width: '880px', height: '118px', backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <span
          className="font-sans text-white"
          style={{ paddingLeft: '32.5px', fontSize: '36px', lineHeight: '1' }}
        >
          {label}
        </span>
      </div>

      {/* Cell 2 (search) */}
      <button
        type="button"
        onClick={onSearchOpen}
        aria-label={searchAriaLabel}
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
        style={{
          left: '880px',
          top: '0',
          width: '200px',
          height: '118px',
          backgroundColor: 'hsl(var(--brand-primary))',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="#fff"
          aria-hidden
        >
          <path d="M55.794,51.464,39.732,35.709a21.567,21.567,0,0,0,4.985-13.776A22.173,22.173,0,0,0,22.358,0,22.173,22.173,0,0,0,0,21.933a22.173,22.173,0,0,0,22.358,21.93A22.519,22.519,0,0,0,36.4,38.973L52.466,54.728a2.385,2.385,0,0,0,3.328,0A2.275,2.275,0,0,0,55.794,51.464ZM22.358,39.246A17.5,17.5,0,0,1,4.707,21.933,17.5,17.5,0,0,1,22.358,4.62,17.5,17.5,0,0,1,40.009,21.933,17.5,17.5,0,0,1,22.358,39.246Z" />
        </svg>
      </button>

      {/* Divider vertical white 1px en x=880.91 (mismo que ListingsToolbar) */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: '880.91px',
          top: '3px',
          width: '1px',
          height: '112px',
          backgroundColor: '#fff',
        }}
      />
    </div>
  );
}
