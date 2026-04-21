'use client';

/**
 * Tabs horizontales scrollables para filtrar por categoría.
 * "Select all" + categorías del módulo. Active → color azul `#1796d6` +
 * underline. Inactivo → gris `#888`.
 */
export function BrochuresTabs({
  categories,
  active,
  onSelect,
}: {
  categories: readonly string[];
  active: string | 'all';
  onSelect: (next: string | 'all') => void;
}) {
  return (
    <div
      className="scrollbar-hide flex items-center overflow-x-auto"
      style={{
        width: '1080px',
        height: '100px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 38px',
        columnGap: '44px',
        flexShrink: 0,
      }}
    >
      <TabButton selected={active === 'all'} onClick={() => onSelect('all')}>
        Select all
      </TabButton>
      {categories.map((c) => (
        <TabButton key={c} selected={active === c} onClick={() => onSelect(c)}>
          {c}
        </TabButton>
      ))}
    </div>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="relative flex-shrink-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{
        height: '100px',
        padding: '0 4px',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '28px',
        lineHeight: '100px',
        fontWeight: selected ? 700 : 500,
        color: selected ? '#1796d6' : '#8e8e8e',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {children}
      {selected ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            bottom: '0',
            height: '4px',
            backgroundColor: '#1796d6',
            borderRadius: '2px 2px 0 0',
          }}
        />
      ) : null}
    </button>
  );
}
