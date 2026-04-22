'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { PassItem } from '@/lib/config';

interface Props {
  pass: PassItem;
}

export function PassCard({ pass }: Props) {
  const [imgError, setImgError] = useState(false);
  return (
    <Link
      href={`/home/passes/${pass.slug}`}
      className="relative block overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        width: '898px',
        height: '400px',
        borderRadius: '12px',
        boxShadow: '0 14px 34px -12px rgba(0,0,0,0.35)',
      }}
      aria-label={pass.title}
    >
      {imgError ? (
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
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className="absolute"
        style={{
          left: '0',
          right: '0',
          top: '60px',
          height: '160px',
          backgroundColor: 'hsl(var(--primary) / 0.78)',
        }}
      />
      <div
        className="absolute flex items-center justify-center text-center"
        style={{ left: '0', right: '0', top: '60px', height: '160px' }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{
            fontSize: '54px',
            letterSpacing: '0.02em',
            lineHeight: 1.05,
            padding: '0 32px',
          }}
        >
          {pass.title}
        </span>
      </div>
    </Link>
  );
}
