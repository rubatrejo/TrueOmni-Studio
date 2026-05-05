'use client';

import { useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { SocialPost } from '@/lib/config';
import { timeAgo } from '@/lib/social-date';

import { SocialSourceIcon } from './social-source-icon';

/**
 * Modal de detalle para posts de tipo 'text' (tweet/post sin media).
 *
 * Card ~840×900 con fondo azul `hsl(var(--brand-secondary))`, avatar+name+source+time arriba,
 * caption grande centrada, X close top-right.
 */
export function SocialPostTextModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  useEscapeToClose(true, onClose);

  return (
    <div role="dialog" aria-modal="true" className="absolute inset-0" style={{ zIndex: 50 }}>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        tabIndex={-1}
      />

      <div
        className="absolute overflow-hidden"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '840px',
          minHeight: '700px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, hsl(var(--brand-secondary)) 0%, hsl(var(--brand-primary)) 100%)',
          padding: '32px 36px 40px 36px',
          color: '#fff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ right: '24px', top: '24px', width: '70px', height: '70px', zIndex: 5 }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-center" style={{ columnGap: '14px', marginTop: '12px' }}>
          <Avatar src={post.author.avatar} />
          <div className="flex flex-col" style={{ rowGap: '4px' }}>
            <span
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '22px',
                lineHeight: '22px',
                fontWeight: 700,
              }}
            >
              {post.author.name}
            </span>
            <span
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '14px',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              @{post.author.username}
            </span>
          </div>
          <div className="ml-auto flex items-center" style={{ columnGap: '8px' }}>
            <SocialSourceIcon source={post.source} size={22} color="#ffffff" />
            <span
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {timeAgo(post.publishedAt)}
            </span>
          </div>
        </div>

        <p
          style={{
            marginTop: '36px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '28px',
            lineHeight: '38px',
            fontWeight: 500,
            color: '#fff',
          }}
        >
          {post.caption}
        </p>
      </div>
    </div>
  );
}

function Avatar({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="overflow-hidden"
      style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        flexShrink: 0,
      }}
    >
      {failed || !src ? (
        <div
          aria-hidden
          className="h-full w-full"
          style={{ background: 'linear-gradient(135deg,#bbb,#888)' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
