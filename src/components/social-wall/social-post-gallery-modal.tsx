'use client';

import { useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { SocialPost } from '@/lib/config';
import { timeAgo } from '@/lib/social-date';

import { SocialSourceIcon } from './social-source-icon';

/**
 * Modal de detalle para posts 'gallery' (carrousel de imágenes).
 *
 * Card 840×1400 con:
 *   - Carrousel hero con flechas ← → + counter "N/M" abajo-izquierda.
 *   - Panel azul inferior con author + source + time + caption.
 *   - X close top-right.
 */
export function SocialPostGalleryModal({
  post,
  onClose,
}: {
  post: SocialPost;
  onClose: () => void;
}) {
  useEscapeToClose(true, onClose);
  const urls = post.galleryUrls ?? [];
  const [index, setIndex] = useState(0);
  const total = urls.length;

  const goPrev = () => setIndex((i) => (i === 0 ? total - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === total - 1 ? 0 : i + 1));

  const ratio = post.aspectRatio ?? 1;

  return (
    <div role="dialog" aria-modal="true" className="absolute inset-0" style={{ zIndex: 50 }}>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}
        tabIndex={-1}
      />

      <div
        className="absolute overflow-hidden"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '840px',
          maxHeight: '1720px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, hsl(var(--brand-secondary)) 0%, #0f6fa0 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* X close estilo ListingDetail — top-right absolute sobre la card */}
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
        {/* Carrousel */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: `${(1 / ratio) * 100}%`,
            backgroundColor: '#000',
          }}
        >
          <GalleryImage src={urls[index] ?? ''} alt={`${index + 1} / ${total}`} />

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Anterior"
                className="absolute flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                style={{
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M14 6l-6 6 6 6"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente"
                className="absolute flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                style={{
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M10 6l6 6-6 6"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          ) : null}

          {/* Counter */}
          <div
            aria-hidden
            className="absolute flex items-center justify-center"
            style={{
              left: '16px',
              bottom: '16px',
              minWidth: '52px',
              height: '30px',
              borderRadius: '15px',
              backgroundColor: 'rgba(0,0,0,0.55)',
              padding: '0 12px',
              color: '#fff',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {index + 1} / {total}
          </div>
        </div>

        {/* Author row + caption */}
        <div style={{ padding: '20px 26px 28px 26px', color: '#fff', position: 'relative' }}>
          <div className="flex items-center" style={{ columnGap: '14px' }}>
            <Avatar src={post.author.avatar} />
            <div className="flex flex-col" style={{ rowGap: '4px' }}>
              <span
                style={{
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '20px',
                  lineHeight: '20px',
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
              <SocialSourceIcon source={post.source} size={20} color="#fff" />
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
                marginTop: '16px',
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

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg,hsl(var(--brand-primary)),hsl(var(--brand-secondary)))' }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Avatar({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="overflow-hidden"
      style={{
        width: '44px',
        height: '44px',
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
