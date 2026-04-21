'use client';

import {
  addWeeks,
  eachDayOfWeek,
  formatWeekRange,
  weekStartOf,
  weekdayShort,
} from '@/lib/events-date';

/**
 * Week picker de Events (verbatim SVG `Events.svg`).
 *
 * 2 filas sobre fondo azul `#004f8b`:
 *   - Fila 1 (y=0..66): flecha ← + "FEBRUARY 6 – FEBRUARY 12" + flecha →.
 *   - Fila 2 (y=66..180): 7 pills SUN..SAT (borde blanco; pill activo = fondo
 *     blanco + texto #004f8b). Gap 12px, total width ~950.
 */
export function WeekPicker({
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onClearDate,
}: {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  /** v2: permitir deseleccionar para ver toda la semana agrupada. */
  onClearDate?: () => void;
}) {
  const weekStart = weekStartOf(selectedDate);
  const days = eachDayOfWeek(weekStart);
  const label = formatWeekRange(weekStart);

  return (
    <div
      className="relative w-full"
      style={{ height: '180px', backgroundColor: '#1e88c6', flexShrink: 0 }}
    >
      {/* Fila 1 — flechas + label */}
      <div
        className="flex items-center justify-center"
        style={{ height: '78px', paddingTop: '14px' }}
      >
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Semana anterior"
          className="flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ width: '56px', height: '56px', color: '#fff' }}
        >
          <Chevron direction="left" />
        </button>
        <span
          className="font-sans uppercase text-white"
          style={{
            fontSize: '34px',
            lineHeight: '34px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            padding: '0 32px',
          }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onNextWeek}
          aria-label="Siguiente semana"
          className="flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ width: '56px', height: '56px', color: '#fff' }}
        >
          <Chevron direction="right" />
        </button>
      </div>

      {/* Fila 2 — 7 pills */}
      <div
        className="flex w-full items-center justify-center"
        style={{ paddingTop: '4px', columnGap: '14px' }}
      >
        {days.map((iso) => {
          const active = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                if (active && onClearDate) onClearDate();
                else onSelectDate(iso);
              }}
              aria-pressed={active}
              aria-label={`Ver eventos del ${iso}`}
              className="font-sans uppercase focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{
                width: '118px',
                height: '64px',
                borderRadius: '8px',
                border: '1.6px solid #ffffff',
                backgroundColor: active ? '#ffffff' : 'transparent',
                color: active ? '#004f8b' : '#ffffff',
                fontSize: '20px',
                lineHeight: '20px',
                fontWeight: active ? 700 : 600,
                letterSpacing: '0.06em',
              }}
            >
              {weekdayShort(iso)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M18 6l-10 10 10 10' : 'M14 6l10 10-10 10';
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Re-export for convenience
export { addWeeks };
