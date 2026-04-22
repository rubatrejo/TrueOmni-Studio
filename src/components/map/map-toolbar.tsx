'use client';

/**
 * Toolbar del módulo Map — adapta la estructura de `ListingsToolbar`:
 *   - Cell 1 (label grande) — "Explore {client} Map" 36px Tahoma white.
 *   - Cell 2 (search) — loupe white sobre fondo azul.
 *   - Cell 3 (filter) — embudo white sobre fondo azul.
 *
 * Sin celda de sort (el Map no tiene orden — los pins se muestran todos por
 * coords). El alto 118px y ancho 1080px coinciden con la toolbar de listings.
 */
export function MapToolbar({
  label,
  onSearch,
  onFilter,
}: {
  label: string;
  onSearch: () => void;
  onFilter: () => void;
}) {
  return (
    <div className="relative" style={{ height: '118px', width: '1080px', flexShrink: 0 }}>
      {/* Cell 1 — label grande */}
      <div
        className="absolute left-0 top-0 flex items-center"
        style={{ width: '682px', height: '118px', backgroundColor: '#004f8b' }}
      >
        <span
          className="font-sans text-white"
          style={{ paddingLeft: '65px', fontSize: '34px', lineHeight: '1', fontWeight: 400 }}
        >
          {label}
        </span>
      </div>

      {/* Cell 2 — search */}
      <button
        type="button"
        onClick={onSearch}
        aria-label="Search"
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
        style={{
          left: '682px',
          top: '0',
          width: '199px',
          height: '118px',
          backgroundColor: '#004f8b',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="52"
          height="52"
          viewBox="0 0 56 56"
          fill="#fff"
          aria-hidden
        >
          <path d="M55.794,51.464,39.732,35.709a21.567,21.567,0,0,0,4.985-13.776A22.173,22.173,0,0,0,22.358,0,22.173,22.173,0,0,0,0,21.933a22.173,22.173,0,0,0,22.358,21.93A22.519,22.519,0,0,0,36.4,38.973L52.466,54.728a2.385,2.385,0,0,0,3.328,0A2.275,2.275,0,0,0,55.794,51.464ZM22.358,39.246A17.5,17.5,0,0,1,4.707,21.933,17.5,17.5,0,0,1,22.358,4.62,17.5,17.5,0,0,1,40.009,21.933,17.5,17.5,0,0,1,22.358,39.246Z" />
        </svg>
      </button>

      {/* Cell 3 — filter */}
      <button
        type="button"
        onClick={onFilter}
        aria-label="Filters"
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
        style={{
          left: '881px',
          top: '0',
          width: '199px',
          height: '118px',
          backgroundColor: '#004f8b',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="46"
          height="48"
          viewBox="0 0 48 50"
          fill="#fff"
          aria-hidden
        >
          <path d="M29.42,50h-.148a.677.677,0,0,1-.467-.1L18.519,43.376a1.152,1.152,0,0,1-.543-.986V25.98H30.434V48.913a1.149,1.149,0,0,1-.543.985A.875.875,0,0,1,29.42,50Zm-.072-26.087H18.478a1.164,1.164,0,0,1-.747-.339L.339,5.095A.975.975,0,0,1,0,4.348V1.087A1.029,1.029,0,0,1,1.087,0H46.739a1.029,1.029,0,0,1,1.087,1.087V4.348a.975.975,0,0,1-.339.747L30.1,23.574A.978.978,0,0,1,29.348,23.913Z" />
        </svg>
      </button>

      {/* Dividers verticales white */}
      {[682, 881].map((x) => (
        <div
          key={x}
          className="pointer-events-none absolute"
          style={{
            left: `${x}px`,
            top: '3px',
            width: '1px',
            height: '112px',
            backgroundColor: 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
}
