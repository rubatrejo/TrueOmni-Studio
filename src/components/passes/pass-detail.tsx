'use client';

import { useState } from 'react';

import { useTextosMap } from '@/components/i18n-provider';
import { BackButton } from '@/components/listings/back-button';
import type { PassItem } from '@/lib/config';

import { ActivityRow } from './activity-row';

interface Props {
  moduleKey: string;
  pass: PassItem;
  onShareOpen: () => void;
}

export function PassDetail({ moduleKey, pass, onShareOpen }: Props) {
  const textos = useTextosMap();
  const [heroError, setHeroError] = useState(false);
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white"
      role="region"
      aria-label={pass.title}
    >
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '620px' }}>
        {heroError ? (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pass.cover}
            alt=""
            onError={() => setHeroError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        {/* CTA GET YOURS — estilo consistente con ActivityRow (rounded-full bg-primary) */}
        <button
          type="button"
          onClick={onShareOpen}
          className="absolute inline-flex items-center justify-center rounded-full bg-primary font-display font-bold uppercase text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            left: '50%',
            bottom: '72px',
            transform: 'translateX(-50%)',
            height: '76px',
            paddingLeft: '56px',
            paddingRight: '56px',
            fontSize: '22px',
            letterSpacing: '0.08em',
            boxShadow: '0 14px 32px -10px rgba(0,0,0,0.4)',
          }}
        >
          {textos.passes_get_yours ?? 'GET YOURS'}
        </button>
      </div>
      <div
        className="relative w-full text-white"
        style={{ height: '118px', backgroundColor: '#004f8b' }}
      >
        <span
          className="absolute font-sans"
          style={{
            left: '32.5px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '36px',
            lineHeight: '1',
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
            {textos.passes_activities_empty ?? 'Activities coming soon.'}
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
