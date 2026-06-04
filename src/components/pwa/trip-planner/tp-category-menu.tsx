'use client';

import type { TpCategory } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** "2026-07-18" → "JULY 18" (UTC determinista para no romper hidratación). */
function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toUpperCase();
  return `${month} ${d.getUTCDate()}`;
}

/** Rango "JULY 18 - JULY 25" derivado del min/max de fechas de los eventos. */
function eventDateRange(items: { date?: string }[]): string {
  const dates = items
    .map((i) => i.date)
    .filter((d): d is string => Boolean(d))
    .sort();
  if (dates.length === 0) return '';
  const start = fmtDay(dates[0]!);
  const end = fmtDay(dates[dates.length - 1]!);
  return start && end ? (start === end ? start : `${start} - ${end}`) : '';
}

/** Glifo por categoría dentro del badge circular. */
function CatGlyph({ catKey }: { catKey: string }) {
  switch (catKey) {
    case 'restaurants':
      return (
        <path
          d="M7 3v7m0 0v11m0-11a2 2 0 002-2V3M17 3c-1.5 0-2.5 1.5-2.5 4s1 4 2.5 4m0 0v10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'events':
      return (
        <path
          d="M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'local-listings':
      return (
        <path
          d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      );
    default: // things-to-do
      return (
        <path
          d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"
          fill="white"
        />
      );
  }
}

function Row({
  label,
  catKey,
  active,
  onClick,
}: {
  label: string;
  catKey: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
    >
      <span
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
        style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden>
          <CatGlyph catKey={catKey} />
        </svg>
      </span>
      <span
        className="text-[14px] font-bold"
        style={{ color: 'hsl(var(--brand-secondary))', opacity: active ? 1 : 0.85 }}
      >
        {label}
      </span>
    </button>
  );
}

export function TpCategoryMenu({
  categories,
  localListingsLabel,
  active,
  onSelect,
  selectedDay,
  onSelectDay,
}: {
  categories: TpCategory[];
  localListingsLabel: string;
  active: string;
  onSelect: (key: string) => void;
  selectedDay: number;
  onSelectDay: (i: number) => void;
}) {
  return (
    <div
      className="absolute left-0 top-0 z-30 w-[210px] rounded-br-[14px] bg-white py-2 shadow-xl"
      style={OPEN_SANS}
    >
      {categories.map((c) => (
        <div key={c.key}>
          <Row
            label={c.label}
            catKey={c.key}
            active={active === c.key}
            onClick={() => onSelect(c.key)}
          />
          {/* Week-strip cuando Events está activo */}
          {c.key === 'events' && active === 'events' && (
            <div className="px-4 pb-2">
              {(() => {
                const range = eventDateRange(c.items ?? []);
                return range ? (
                  <div
                    className="mb-2 flex items-center justify-center gap-3 text-[13px] font-bold"
                    style={{ color: 'hsl(var(--brand-secondary))' }}
                  >
                    <span>‹</span>
                    <span>{range}</span>
                    <span>›</span>
                  </div>
                ) : null;
              })()}
              <div className="flex flex-col gap-1.5">
                {DAYS.map((d, i) => {
                  const on = i === selectedDay;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDay(i)}
                      className="rounded-full border py-1 text-center text-[11px] font-bold"
                      style={{
                        borderColor: 'hsl(var(--brand-secondary))',
                        backgroundColor: on ? 'hsl(var(--brand-secondary))' : 'transparent',
                        color: on ? '#fff' : 'hsl(var(--brand-secondary))',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
      <Row
        label={localListingsLabel}
        catKey="local-listings"
        active={active === 'local-listings'}
        onClick={() => onSelect('local-listings')}
      />
    </div>
  );
}
