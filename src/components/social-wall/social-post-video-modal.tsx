'use client';

import { useEffect, useRef, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { SocialPost } from '@/lib/config';
import { timeAgo } from '@/lib/social-date';

import { SocialSourceIcon } from './social-source-icon';

/**
 * Modal de detalle para posts 'video' — mismo layout que el Image modal:
 *   - Card centrada 840px con gradient azul y X circular top-right.
 *   - Video 16:9 autoplay + muted + loop + playsInline arriba.
 *   - Click en el video → toggle pause/play.
 *   - Author row + source + time + caption en el panel inferior.
 */
export function SocialPostVideoModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  useEscapeToClose(true, onClose);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  // Workaround React bug: `muted` como prop JSX se aplica después del primer
  // render, lo que puede hacer que el browser bloquee el autoplay. Forzamos
  // muted + play via ref en el mount.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    const attempt = v.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        /* autoplay policy fallback */
      });
    }
  }, [post.mediaUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = true;
      void v.play().catch(() => {
        /* autoplay policy fallback */
      });
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="absolute inset-0" style={{ zIndex: 50 }}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        tabIndex={-1}
      />

      {/* Card centrada */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '840px',
          maxHeight: '1720px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, hsl(var(--brand-secondary)) 0%, hsl(var(--brand-primary)) 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* X close estilo ListingDetail */}
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

        {/* Video — respeta el aspectRatio del post (16:9 default, 9:16 para reels) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: `${(1 / (post.aspectRatio ?? 16 / 9)) * 100}%`,
            backgroundColor: '#000',
          }}
        >
          {post.mediaUrl ? (
            <video
              ref={videoRef}
              src={post.mediaUrl}
              poster={post.videoPoster}
              autoPlay
              muted
              loop
              playsInline
              onClick={togglePlay}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <track kind="captions" />
            </video>
          ) : (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg,hsl(var(--brand-primary)),hsl(var(--brand-secondary)))' }}
            />
          )}

          {/* Paused overlay */}
          {paused ? (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Reanudar"
              className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '3px solid #fff',
                }}
              >
                <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" fill="#fff" />
                </svg>
              </div>
            </button>
          ) : null}
        </div>

        {/* Author + caption — mismo estilo que Image modal */}
        <div style={{ padding: '22px 28px 28px 28px', color: '#fff', position: 'relative' }}>
          <div className="flex items-center" style={{ columnGap: '14px' }}>
            <Avatar src={post.author.avatar} />
            <div className="flex flex-col" style={{ rowGap: '4px' }}>
              <span
                style={{
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '22px',
                  lineHeight: '22px',
                  fontWeight: 700,
                  color: '#ffffff',
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

          {post.caption ? (
            <p
              style={{
                marginTop: '18px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '16px',
                lineHeight: '22px',
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              {post.caption}
            </p>
          ) : null}
        </div>
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
