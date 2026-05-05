'use client';

/**
 * Toolbar verbatim SVG Food & Drink (y=620..738, 1080×118).
 * 4 celdas:
 *   - Cell 1 (0..481)   hsl(var(--brand-primary)) — label "Food & Drink" 36px Tahoma white @ (32.5, 37.5).
 *   - Cell 2 (481..682) hsl(var(--brand-primary)) — search loupe icon white.
 *   - Cell 3 (682..883) #fff    — sort icon blue.
 *   - Cell 4 (883..1080)hsl(var(--brand-primary)) — filter icon white.
 * Vertical dividers white 1px en x=481.95, 682.63, 880.91.
 */

export function ListingsToolbar({
  label,
  onSearch,
  onSort,
  onFilter,
  activeSort = false,
}: {
  label: string;
  onSearch: () => void;
  onSort: () => void;
  onFilter: () => void;
  activeSort?: boolean;
}) {
  return (
    <div className="relative" style={{ height: '118px', width: '1080px', flexShrink: 0 }}>
      {/* Cell 1 (label) */}
      <div
        className="absolute left-0 top-0 flex items-center"
        style={{ width: '481px', height: '118px', backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <span
          className="font-sans text-white"
          style={{ paddingLeft: '32.5px', fontSize: '36px', lineHeight: '1', fontWeight: 600 }}
        >
          {label}
        </span>
      </div>

      {/* Cell 2 (search) */}
      <button
        type="button"
        onClick={onSearch}
        aria-label="Buscar"
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
        style={{
          left: '481px',
          top: '0',
          width: '201px',
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

      {/* Cell 3 (sort) — white bg */}
      <button
        type="button"
        onClick={onSort}
        aria-label="Ordenar"
        aria-pressed={activeSort}
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-500/60"
        style={{
          left: '682px',
          top: '0',
          width: '201px',
          height: '118px',
          backgroundColor: '#fff',
        }}
      >
        {/* Sort arrows icon (ascending/descending) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="45"
          height="45"
          viewBox="0 0 45 45"
          fill="hsl(var(--brand-primary))"
          aria-hidden
        >
          <path d="M42.5,45h0L35,35h5V0h5V35h5L42.5,45ZM10,45H0V40H10v5Zm5-10H0V30H15v5Zm5-10H0V20H20v5Zm5-10H0V10H25v5ZM30,5H0V0H30V5Z" />
        </svg>
      </button>

      {/* Cell 4 (filter) */}
      <button
        type="button"
        onClick={onFilter}
        aria-label="Filtros"
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
        style={{
          left: '883px',
          top: '0',
          width: '197px',
          height: '118px',
          backgroundColor: 'hsl(var(--brand-primary))',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="50"
          viewBox="0 0 48 50"
          fill="#fff"
          aria-hidden
        >
          <path d="M29.42,50h-.148a.677.677,0,0,1-.467-.1L18.519,43.376a1.152,1.152,0,0,1-.543-.986V25.98H30.434V48.913a1.149,1.149,0,0,1-.543.985A.875.875,0,0,1,29.42,50Zm-.072-26.087H18.478a1.164,1.164,0,0,1-.747-.339L.339,5.095A.975.975,0,0,1,0,4.348V1.087A1.029,1.029,0,0,1,1.087,0H46.739a1.029,1.029,0,0,1,1.087,1.087V4.348a.975.975,0,0,1-.339.747L30.1,23.574A.978.978,0,0,1,29.348,23.913Z" />
        </svg>
      </button>

      {/* Dividers verticales */}
      {[481.95, 682.63, 880.91].map((x) => (
        <div
          key={x}
          className="pointer-events-none absolute"
          style={{
            left: `${x}px`,
            top: '3px',
            width: '1px',
            height: '112px',
            backgroundColor: x === 682.63 ? '#e5e7eb' : '#fff',
          }}
        />
      ))}
    </div>
  );
}
