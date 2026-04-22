'use client';

interface Props {
  label: string;
  onSearchOpen: () => void;
  searchAriaLabel: string;
}

export function PassesToolbar({ label, onSearchOpen, searchAriaLabel }: Props) {
  return (
    <div className="relative w-full bg-primary text-primary-foreground" style={{ height: '118px' }}>
      <span
        className="absolute font-display font-semibold"
        style={{
          left: '91px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '32px',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
      <button
        type="button"
        aria-label={searchAriaLabel}
        onClick={onSearchOpen}
        className="absolute flex items-center justify-center rounded-full text-primary-foreground transition hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          right: '80px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '64px',
          height: '64px',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
