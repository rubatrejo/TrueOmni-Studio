'use client';

import { useState } from 'react';

import type { PassActivity } from '@/lib/config';

interface Props {
  activity: PassActivity;
  viewWebsiteLabel: string;
}

export function ActivityRow({ activity, viewWebsiteLabel }: Props) {
  const [imgError, setImgError] = useState(false);
  const handleOpenWebsite = () => {
    if (typeof window !== 'undefined') {
      window.open(activity.website, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <div
      className="flex overflow-hidden bg-white"
      style={{
        width: '898px',
        minHeight: '220px',
        borderRadius: '12px',
        boxShadow: '0 6px 18px -8px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ width: '220px', height: '220px', flexShrink: 0 }}>
        {imgError ? (
          <div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)',
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.image}
            alt=""
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div
        className="flex flex-1 flex-col"
        style={{ padding: '18px 24px', gap: '8px', justifyContent: 'space-between' }}
      >
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <h3
            className="font-display font-bold text-foreground"
            style={{ fontSize: '22px', lineHeight: 1.2 }}
          >
            {activity.title}
          </h3>
          <p
            className="font-sans text-gray-600"
            style={{
              fontSize: '14px',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {activity.description}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenWebsite}
          className="inline-flex items-center justify-center rounded-full bg-primary font-display font-bold uppercase tracking-[0.06em] text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          style={{
            width: 'fit-content',
            height: '40px',
            paddingLeft: '20px',
            paddingRight: '20px',
            fontSize: '13px',
          }}
        >
          {viewWebsiteLabel}
        </button>
      </div>
    </div>
  );
}
