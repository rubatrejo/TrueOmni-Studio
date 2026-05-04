'use client';

import { useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { SocialPost } from '@/lib/config';
import { timeAgo } from '@/lib/social-date';

import { SocialSourceIcon } from './social-source-icon';

/**
 * Modal de detalle para posts de tipo 'image' (matching SVG
 * `Social Wall-Post_Image_Details.svg`).
 *
 *  Card 840×1400 centered:
 *   - Panel azul superior 840×160 con avatar+name+@username (izq) + icono
 *     source + "X hours ago" (der) + X close absolute top-right.
 *   - Imagen hero (aspect real) ~840×820.
 *   - Panel azul inferior con caption (Helvetica 14, white, ~6 líneas).
 */
export function SocialPostImageModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  useEscapeToClose(true, onClose);

  const ratio = post.aspectRatio ?? 1;

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

      {/* Card centrada en el canvas */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '840px',
          maxHeight: '1720px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, #1796d6 0%, #0f6fa0 100%)',
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
        {/* Imagen hero */}
        <div
          style={{ position: 'relative', width: '100%', paddingBottom: `${(1 / ratio) * 100}%` }}
        >
          <HeroImage src={post.mediaUrl ?? ''} alt={post.caption} />
        </div>

        {/* Header autor + source + close (se dibuja encima del inicio de la imagen
            para matching con el SVG que tiene header sobre la imagen). Aquí lo
            ponemos debajo por simplicidad v1: AUTHOR row + caption en panel azul. */}
        <AuthorRowAndCaption post={post} />
      </div>
    </div>
  );
}

function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, #1796d6 100%)' }}
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

function AuthorRowAndCaption({ post }: { post: SocialPost }) {
  return (
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
