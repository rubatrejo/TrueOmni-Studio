'use client';

import { eachDayOfWeek, formatWeekRange, weekStartOf, weekdayShort } from '@/lib/events-date';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BRAND = 'hsl(var(--brand-primary))';
const SECONDARY = 'hsl(var(--brand-secondary))';

/**
 * Selector de día de la PWA (versión mobile del `events/week-picker.tsx` del kiosk).
 * Dos filas sobre fondo `--brand-primary`:
 *   - Fila 1: flechas ‹ › para cambiar de semana + rango ("FEB 6 – 12").
 *   - Fila 2: 7 pills (weekday corto + número de día); el pill del día seleccionado
 *     va relleno (blanco) con texto de marca.
 *
 * Reutiliza los helpers de fecha de Events (`weekStartOf`, `eachDayOfWeek`,
 * `formatWeekRange`, `weekdayShort`). White-label: colores por tokens.
 */
export function PwaWeekPicker({
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const weekStart = weekStartOf(selectedDate);
  const days = eachDayOfWeek(weekStart);
  const label = formatWeekRange(weekStart);

  return (
    <div
      className="shrink-0"
      style={{ backgroundColor: SECONDARY, paddingBottom: 10, paddingTop: 4 }}
    >
      {/* Fila 1 — flechas + rango */}
      <div className="flex items-center justify-center" style={{ height: 34 }}>
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Previous week"
          className="flex items-center justify-center text-white"
          style={{ width: 36, height: 32 }}
        >
          <Chevron direction="left" />
        </button>
        <span
          className="text-center uppercase text-white"
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.06em',
            minWidth: 150,
            ...OPEN_SANS,
          }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onNextWeek}
          aria-label="Next week"
          className="flex items-center justify-center text-white"
          style={{ width: 36, height: 32 }}
        >
          <Chevron direction="right" />
        </button>
      </div>

      {/* Fila 2 — 7 pills */}
      <div className="flex items-center justify-center px-2" style={{ columnGap: 5 }}>
        {days.map((iso) => {
          const active = iso === selectedDate;
          const dayNum = Number(iso.slice(8, 10));
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              aria-pressed={active}
              aria-label={`Tickets for ${iso}`}
              className="flex flex-1 flex-col items-center justify-center"
              style={{
                height: 50,
                borderRadius: 8,
                border: '1.5px solid #ffffff',
                backgroundColor: active ? '#ffffff' : 'transparent',
                color: active ? BRAND : '#ffffff',
              }}
            >
              <span
                className="uppercase"
                style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', ...OPEN_SANS }}
              >
                {weekdayShort(iso)}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: active ? 700 : 600,
                  lineHeight: '18px',
                  ...OPEN_SANS,
                }}
              >
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7';
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
