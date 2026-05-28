'use client';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Fila de radio (single-select) estilo iOS del XD: círculo outline + label.
 * Seleccionado → punto interior en `--brand-primary`. Texto en brand-primary.
 */
export function RadioRow({
  selected,
  label,
  onSelect,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full items-center gap-4 py-3 text-left"
    >
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2"
        style={{
          borderColor: selected ? 'hsl(var(--brand-primary))' : 'hsl(var(--foreground) / 0.35)',
        }}
      >
        {selected ? (
          <span className="h-[11px] w-[11px] rounded-full bg-[hsl(var(--brand-primary))]" />
        ) : null}
      </span>
      <span className="text-[hsl(var(--brand-primary))]" style={{ fontSize: 14, ...OPEN_SANS }}>
        {label}
      </span>
    </button>
  );
}

/**
 * Fila de checkbox estilo iOS del XD: cuadro + check + label. Marcado → cuadro
 * relleno en `--brand-primary` con check blanco.
 */
export function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] border-2"
        style={{
          borderColor: 'hsl(var(--brand-primary))',
          backgroundColor: checked ? 'hsl(var(--brand-primary))' : 'transparent',
        }}
      >
        {checked ? (
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : null}
      </span>
      <span className="text-[hsl(var(--brand-primary))]" style={{ fontSize: 14, ...OPEN_SANS }}>
        {label}
      </span>
    </button>
  );
}
