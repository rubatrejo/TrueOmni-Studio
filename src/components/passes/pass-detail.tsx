'use client';

import { BackButton } from '@/components/listings/back-button';
import type { PassItem } from '@/lib/config';

import { ActivityRow } from './activity-row';

interface Props {
  moduleKey: string;
  pass: PassItem;
  textos: Record<string, string>;
  onShareOpen: () => void;
}

export function PassDetail({ moduleKey, pass, textos, onShareOpen }: Props) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white"
      role="region"
      aria-label={pass.title}
    >
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '620px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pass.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <button
          type="button"
          onClick={onShareOpen}
          className="absolute inline-flex items-center justify-center rounded-full bg-primary font-display font-bold uppercase tracking-[0.1em] text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            left: '50%',
            bottom: '72px',
            transform: 'translateX(-50%)',
            height: '68px',
            paddingLeft: '48px',
            paddingRight: '48px',
            fontSize: '20px',
            boxShadow: '0 14px 32px -10px rgba(0,0,0,0.4)',
          }}
        >
          {textos.passes_get_yours ?? 'GET YOURS'}
        </button>
      </div>
      <div
        className="relative w-full bg-primary text-primary-foreground"
        style={{ height: '118px' }}
      >
        <span
          className="absolute font-display font-semibold"
          style={{
            left: '91px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '30px',
            letterSpacing: '0.01em',
          }}
        >
          {pass.title}
        </span>
      </div>
      <main
        className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingTop: '32px', paddingBottom: '140px' }}
      >
        {pass.activities.length === 0 ? (
          <div
            className="flex items-center justify-center font-sans text-gray-500"
            style={{
              width: '898px',
              marginLeft: '91px',
              marginRight: '91px',
              paddingTop: '80px',
              fontSize: '22px',
            }}
          >
            Activities coming soon.
          </div>
        ) : (
          <div
            className="flex flex-col"
            style={{ rowGap: '20px', width: '898px', marginLeft: '91px', marginRight: '91px' }}
          >
            {pass.activities.map((act) => (
              <ActivityRow
                key={act.slug}
                activity={act}
                viewWebsiteLabel={textos.passes_view_website ?? 'View Website'}
              />
            ))}
          </div>
        )}
      </main>
      <BackButton href={`/home/${moduleKey}`} />
    </div>
  );
}
