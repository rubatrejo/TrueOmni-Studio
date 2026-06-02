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
  compact = false,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  /** Variante reducida (~20% menor) — usada por el Survey de la PWA. */
  compact?: boolean;
}) {
  const box = compact ? 18 : 22;
  const dot = compact ? 9 : 11;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-center text-left ${compact ? 'gap-3 py-2.5' : 'gap-4 py-3'}`}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full border-2"
        style={{
          width: box,
          height: box,
          borderColor: selected ? 'hsl(var(--brand-primary))' : 'hsl(var(--foreground) / 0.35)',
        }}
      >
        {selected ? (
          <span
            className="rounded-full bg-[hsl(var(--brand-primary))]"
            style={{ width: dot, height: dot }}
          />
        ) : null}
      </span>
      <span
        className="text-[hsl(var(--brand-primary))]"
        style={{ fontSize: compact ? 11 : 14, ...OPEN_SANS }}
      >
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
  compact = false,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  /** Variante reducida (~20% menor) — usada por el Survey de la PWA. */
  compact?: boolean;
}) {
  const box = compact ? 18 : 22;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-center text-left ${compact ? 'gap-2.5 py-2' : 'gap-3 py-2'}`}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-[4px] border-2"
        style={{
          width: box,
          height: box,
          borderColor: 'hsl(var(--brand-primary))',
          backgroundColor: checked ? 'hsl(var(--brand-primary))' : 'transparent',
        }}
      >
        {checked ? (
          <svg
            width={compact ? 11 : 13}
            height={compact ? 11 : 13}
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
      <span
        className="text-[hsl(var(--brand-primary))]"
        style={{ fontSize: compact ? 11 : 14, ...OPEN_SANS }}
      >
        {label}
      </span>
    </button>
  );
}
