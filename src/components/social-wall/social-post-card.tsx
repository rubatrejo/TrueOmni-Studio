'use client';

import { useState } from 'react';

import type { SocialPost } from '@/lib/config';

import { SocialSourceIcon } from './social-source-icon';

/**
 * Card de un post en la grilla masonry.
 *
 * Layout:
 *   - Media arriba (imagen o poster de video) con aspect dinámico.
 *   - Badge con icono de red social en esquina top-right.
 *   - Play button centered si type='video'.
 *   - Panel azul hsl(var(--brand-secondary)) con avatar + username + caption.
 *   - Si gallery → counter "1/N" en corner.
 *   - Si type='text' → sin media, solo panel azul full card.
 *
 * Click → `onOpen(post)`.
 */
export function SocialPostCard({
  post,
  onOpen,
}: {
  post: SocialPost;
  onOpen: (post: SocialPost) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      aria-label={`Abrir post de ${post.author.name}`}
      className="block w-full overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{
        marginBottom: '16px',
        borderRadius: '10px',
        backgroundColor: '#222',
        breakInside: 'avoid',
        boxShadow: '0 4px 10px rgba(0,0,0,0.14)',
      }}
    >
      {post.type === 'text' ? (
        <TextBody post={post} />
      ) : (
        <div className="relative">
          <Media post={post} />
          {/* Panel overlay al bottom: gradient dark-bottom → transparent-top,
              extenso sobre la imagen. */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              padding: post.caption ? '110px 14px 14px 14px' : '90px 14px 14px 14px',
              background:
                'linear-gradient(0deg, #0a4b78 0%, rgba(10,75,120,0.92) 35%, rgba(10,75,120,0.5) 70%, rgba(10,75,120,0) 100%)',
              color: '#ffffff',
            }}
          >
            <AuthorRow post={post} />
            {post.caption ? (
              <p
                style={{
                  marginTop: '8px',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: 'rgba(255,255,255,0.98)',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.caption}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </button>
  );
}

function Media({ post }: { post: SocialPost }) {
  // Respetamos el aspectRatio del config en todos los tipos. Videos sin
  // aspectRatio caen a 16:9 landscape como default; con aspectRatio pueden
  // ser 9:16 (reel/short) o landscape según el cliente.
  const defaultRatio = post.type === 'video' ? 16 / 9 : 1;
  const ratio = post.aspectRatio ?? defaultRatio;
  const src =
    post.type === 'video'
      ? (post.videoPoster ?? post.mediaUrl ?? '')
      : post.type === 'gallery'
        ? (post.galleryUrls?.[0] ?? '')
        : (post.mediaUrl ?? '');

  return (
    <div
      className="relative w-full"
      style={{ paddingBottom: `${(1 / ratio) * 100}%`, backgroundColor: '#222' }}
    >
      <MediaImage src={src} alt="" />

      {/* Source badge top-right */}
      <div
        aria-hidden
        className="absolute flex items-center justify-center"
        style={{
          right: '10px',
          top: '10px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <SocialSourceIcon source={post.source} size={18} color="#ffffff" />
      </div>

      {/* Play button para videos */}
      {post.type === 'video' ? (
        <div
          aria-hidden
          className="absolute flex items-center justify-center"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.35)',
            border: '3px solid #ffffff',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l11-7z" fill="#ffffff" />
          </svg>
        </div>
      ) : null}

      {/* Counter para gallery */}
      {post.type === 'gallery' && post.galleryUrls && post.galleryUrls.length > 1 ? (
        <div
          aria-hidden
          className="absolute flex items-center justify-center"
          style={{
            left: '10px',
            top: '10px',
            minWidth: '44px',
            height: '28px',
            borderRadius: '14px',
            backgroundColor: 'rgba(0,0,0,0.55)',
            padding: '0 10px',
            color: '#fff',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          1/{post.galleryUrls.length}
        </div>
      ) : null}
    </div>
  );
}

function MediaImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)' }}
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

function TextBody({ post }: { post: SocialPost }) {
  return (
    <div
      style={{
        padding: '18px 18px 22px 18px',
        color: '#ffffff',
        position: 'relative',
        background: '#0a4b78',
      }}
    >
      <AuthorRow post={post} showSourceBadge />
      <p
        style={{
          marginTop: '12px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '18px',
          lineHeight: '24px',
          color: '#ffffff',
          fontWeight: 500,
          display: '-webkit-box',
          WebkitLineClamp: 6,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.caption}
      </p>
    </div>
  );
}

function AuthorRow({
  post,
  showSourceBadge = false,
}: {
  post: SocialPost;
  /** Muestra el icono de red social a la derecha (para type=text). */
  showSourceBadge?: boolean;
}) {
  return (
    <div className="flex items-center" style={{ columnGap: '10px' }}>
      <AvatarSmall src={post.author.avatar} />
      <span
        style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '14px',
          fontWeight: 700,
          color: '#ffffff',
        }}
      >
        @{post.author.username}
      </span>
      {showSourceBadge ? (
        <span className="ml-auto">
          <SocialSourceIcon source={post.source} size={18} color="#ffffff" />
        </span>
      ) : null}
    </div>
  );
}

function AvatarSmall({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="overflow-hidden"
      style={{
        width: '28px',
        height: '28px',
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
