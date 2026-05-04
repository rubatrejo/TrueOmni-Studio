'use client';

import type { GuestbookCountry } from '@/lib/config';

export type GuestbookField = 'name' | 'email' | 'phone' | 'zip';

interface Labels {
  name: string;
  email: string;
  phone: string;
  country: string;
  zip: string;
}

/**
 * Grid 2×3 de inputs del form del Guestbook. Cada input es readonly y
 * dispara `onFocus(field)` al tocarse para que el padre decida qué teclado
 * renderear (QWERTY para name/email/phone, NumericKeypad para zip,
 * dropdown overlay para country).
 *
 * Layout del mockup (pantalla 1):
 *   row 1: Complete Name (col 1-4) | Email (col 5-8)
 *   row 2: Phone (col 1-2) | Country (col 3-4) | Zip (col 5)
 */
export function GuestbookFormFields({
  values,
  focused,
  labels,
  selectedCountry,
  onFocus,
  onOpenCountry,
}: {
  values: { name: string; email: string; phone: string; zip: string };
  focused: GuestbookField | 'country' | null;
  labels: Labels;
  selectedCountry: GuestbookCountry | null;
  onFocus: (f: GuestbookField) => void;
  onOpenCountry: () => void;
}) {
  return (
    <div className="flex flex-col" style={{ rowGap: '20px' }}>
      <div className="flex" style={{ columnGap: '20px' }}>
        <InputShell
          placeholder={labels.name}
          value={values.name}
          focused={focused === 'name'}
          onClick={() => onFocus('name')}
          flex={1}
        />
        <InputShell
          placeholder={labels.email}
          value={values.email}
          focused={focused === 'email'}
          onClick={() => onFocus('email')}
          flex={1}
        />
      </div>
      <div className="flex" style={{ columnGap: '20px' }}>
        <InputShell
          placeholder={labels.phone}
          value={values.phone}
          focused={focused === 'phone'}
          onClick={() => onFocus('phone')}
          flex={1.1}
        />
        <InputShell
          placeholder={labels.country}
          value={selectedCountry?.name ?? ''}
          focused={focused === 'country'}
          onClick={onOpenCountry}
          flex={1}
          withChevron
        />
        <InputShell
          placeholder={labels.zip}
          value={values.zip}
          focused={focused === 'zip'}
          onClick={() => onFocus('zip')}
          flex={1}
        />
      </div>
    </div>
  );
}

function InputShell({
  placeholder,
  value,
  focused,
  onClick,
  flex,
  withChevron,
}: {
  placeholder: string;
  value: string;
  focused: boolean;
  onClick: () => void;
  flex: number;
  withChevron?: boolean;
}) {
  const hasValue = value.length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={placeholder}
      className="flex items-center font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{
        flex: `${flex} 1 0`,
        height: '72px',
        padding: '0 24px',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        border: focused ? '2px solid hsl(var(--brand-secondary))' : '1px solid #c7c7c7',
        color: hasValue ? '#1a1a1a' : '#8a8a8a',
        fontSize: '22px',
        lineHeight: '22px',
        fontWeight: 500,
        textAlign: 'left',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          textAlign: 'left',
        }}
      >
        {hasValue ? value : placeholder}
      </span>
      {withChevron ? (
        <span aria-hidden style={{ fontSize: '12px', color: '#8a8a8a', marginLeft: '10px' }}>
          ▼
        </span>
      ) : null}
    </button>
  );
}
