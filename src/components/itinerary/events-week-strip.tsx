'use client';

export interface EventsWeekStripProps {
  /** Inicio (domingo) de la semana visible. */
  weekStart: Date;
  /** Día seleccionado dentro de la semana visible (0=domingo, 6=sábado). */
  selectedDayIndex: number;
  /** Locale del cliente para traducir días/meses (Intl). Default 'en-US'. */
  locale?: string;
  onDayChange: (dayIndex: number) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const formatRange = (weekStart: Date, locale: string) => {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  const startMonth = monthFmt.format(weekStart).toUpperCase();
  const endMonth = monthFmt.format(end).toUpperCase();
  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${end.getDate()}`;
};

const buildDayLabels = (locale: string): string[] => {
  const sunday = new Date(Date.UTC(2024, 0, 7));
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setUTCDate(sunday.getUTCDate() + i);
    return fmt.format(d).toUpperCase().slice(0, 3);
  });
};

/**
 * Week strip del Trip Planner en tab Events. Pixel-close al `WeekPicker`
 * del módulo Events (verbatim SVG `Events.svg`):
 *   - 180px alto · bg `#1e88c6` (azul medio Eat).
 *   - Row 1 (78px): chevron + uppercase 34px bold + chevron.
 *   - Row 2 (102px): 7 pills SUN..SAT 118×64, rounded-md, white border 1.6px,
 *     active = white fill + text `hsl(var(--brand-primary))`.
 */
export function EventsWeekStrip(props: EventsWeekStripProps) {
  const { weekStart, selectedDayIndex, onDayChange, onPrevWeek, onNextWeek } = props;
  const locale = props.locale ?? 'en-US';
  const dayLabels = buildDayLabels(locale);

  return (
    <div
      className="absolute left-0 text-white"
      style={{
        top: 350,
        width: 1080,
        height: 180,
        backgroundColor: '#1e88c6',
        zIndex: 9,
      }}
    >
      {/* Row 1 — chevron + label + chevron */}
      <div
        className="flex items-center justify-center"
        style={{ height: 78, paddingTop: 14 }}
      >
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Previous week"
          className="flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ width: 56, height: 56 }}
        >
          <Chevron direction="left" />
        </button>
        <span
          className="font-sans uppercase text-white"
          style={{
            fontSize: 34,
            lineHeight: '34px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            padding: '0 32px',
          }}
        >
          {formatRange(weekStart, locale)}
        </span>
        <button
          type="button"
          onClick={onNextWeek}
          aria-label="Next week"
          className="flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ width: 56, height: 56 }}
        >
          <Chevron direction="right" />
        </button>
      </div>

      {/* Row 2 — 7 pills */}
      <div
        className="flex w-full items-center justify-center"
        style={{ paddingTop: 4, columnGap: 14 }}
      >
        {dayLabels.map((label, i) => {
          const isActive = i === selectedDayIndex;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onDayChange(i)}
              aria-pressed={isActive}
              className="font-sans uppercase focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{
                width: 118,
                height: 64,
                borderRadius: 8,
                border: '1.6px solid #ffffff',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? 'hsl(var(--brand-primary))' : '#ffffff',
                fontSize: 20,
                lineHeight: '20px',
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '0.06em',
              }}
            >
              {label}
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

/** Helper: domingo de la semana actual (00:00 local). */
export function getWeekStart(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Helper: domingo +/- N semanas. */
export function shiftWeek(weekStart: Date, weeks: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** ISO `YYYY-MM-DD` local del día (weekStart + dayIndex). */
export function isoDate(weekStart: Date, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
