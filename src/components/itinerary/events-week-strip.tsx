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
  return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${end.getDate()}`;
};

const buildDayLabels = (locale: string): string[] => {
  // Genera labels SUN-SAT con Intl. Usamos un domingo conocido (2024-01-07).
  const sunday = new Date(Date.UTC(2024, 0, 7));
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setUTCDate(sunday.getUTCDate() + i);
    return fmt.format(d).toUpperCase().slice(0, 3);
  });
};

export function EventsWeekStrip(props: EventsWeekStripProps) {
  const { weekStart, selectedDayIndex, onDayChange, onPrevWeek, onNextWeek } = props;
  const locale = props.locale ?? 'en-US';
  const dayLabels = buildDayLabels(locale);

  return (
    <div
      className="absolute left-0 flex flex-col items-center gap-3 px-6 text-white"
      style={{
        top: 320,
        width: 1080,
        height: 130,
        backgroundColor: 'hsl(var(--itinerary-toolbar-bg))',
        zIndex: 9,
      }}
    >
      <div className="flex w-full items-center justify-center pt-3">
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Previous week"
          className="flex h-9 w-9 items-center justify-center text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="mx-4 text-[20px] font-semibold tracking-wider">
          {formatRange(weekStart, locale)}
        </span>
        <button
          type="button"
          onClick={onNextWeek}
          aria-label="Next week"
          className="flex h-9 w-9 items-center justify-center text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        {dayLabels.map((label, i) => {
          const isActive = i === selectedDayIndex;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onDayChange(i)}
              aria-pressed={isActive}
              className="flex h-[44px] flex-1 items-center justify-center rounded-md text-[14px] font-bold transition"
              style={{
                backgroundColor: isActive ? 'white' : 'transparent',
                color: isActive ? 'hsl(var(--itinerary-toolbar-bg))' : 'white',
                border: '1px solid rgba(255,255,255,0.5)',
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
