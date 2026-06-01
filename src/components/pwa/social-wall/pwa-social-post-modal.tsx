'use client';

import { useEffect, useRef, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { SocialSourceIcon } from '@/components/social-wall/social-source-icon';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { SocialPost } from '@/lib/config';
import { timeAgo } from '@/lib/social-date';

const OPEN_SANS = 'var(--font-open-sans)';
const CARD_BG =
  'linear-gradient(180deg, hsl(var(--brand-secondary)) 0%, hsl(var(--brand-primary)) 100%)';

/**
 * Lightbox por tipo (PWA) — réplica móvil del detalle del Social Wall del kiosk.
 * Backdrop oscuro (tap cierra) + card azul centrada con X. El área de media
 * cambia por tipo (image / video / gallery / text) y debajo el footer común
 * (avatar + nombre + @usuario + red + time-ago + caption). Misma lógica del kiosk.
 */
export function PwaSocialPostModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  useEscapeToClose(true, onClose);

  return (
    <div role="dialog" aria-modal="true" className="absolute inset-0" style={{ zIndex: 50 }}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
      />
      <div
        className="scrollbar-hide absolute left-1/2 top-1/2 w-[92%] max-w-[340px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-[16px]"
        style={{ maxHeight: '88%', background: CARD_BG, boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute z-10 flex items-center justify-center text-white"
          style={{ right: 12, top: 12, width: 34, height: 34 }}
        >
          <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden>
            <circle
              cx="12"
              cy="12"
              r="11"
              fill="rgba(0,0,0,0.35)"
              stroke="#fff"
              strokeWidth="1.4"
            />
            <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {post.type === 'video' ? (
          <VideoMedia post={post} />
        ) : post.type === 'gallery' ? (
          <GalleryMedia post={post} />
        ) : post.type === 'image' ? (
          <ImageMedia src={post.mediaUrl ?? ''} alt={post.caption} />
        ) : null}

        <PostFooter post={post} big={post.type === 'text'} />
      </div>
    </div>
  );
}

function PostFooter({ post, big }: { post: SocialPost; big?: boolean }) {
  return (
    <div className="relative px-4 pb-5 pt-4 text-white">
      <div className="flex items-center gap-2.5">
        <Avatar src={post.author.avatar} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-bold" style={{ fontSize: 15, fontFamily: OPEN_SANS }}>
            {post.author.name}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: OPEN_SANS }}>
            @{post.author.username}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <SocialSourceIcon source={post.source} size={18} color="#ffffff" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: OPEN_SANS }}>
            {timeAgo(post.publishedAt)}
          </span>
        </div>
      </div>
      {post.caption ? (
        <p
          className="mt-3"
          style={{
            fontSize: big ? 17 : 14,
            lineHeight: 1.5,
            fontWeight: big ? 500 : 400,
            color: 'rgba(255,255,255,0.96)',
            fontFamily: OPEN_SANS,
          }}
        >
          {post.caption}
        </p>
      ) : null}
    </div>
  );
}

function ImageMedia({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        aria-hidden
        style={{
          width: '100%',
          aspectRatio: '1',
          background:
            'linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-secondary)))',
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      onError={() => setFailed(true)}
      className="block w-full"
      style={{ height: 'auto' }}
    />
  );
}

function VideoMedia({ post }: { post: SocialPost }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const ratio = post.aspectRatio ?? 16 / 9;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    const attempt = v.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = true;
      void v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: `${(1 / ratio) * 100}%`,
        backgroundColor: '#000',
      }}
    >
      {post.mediaUrl ? (
        <video
          ref={videoRef}
          src={resolveAssetUrl(post.mediaUrl)}
          poster={post.videoPoster ? resolveAssetUrl(post.videoPoster) : undefined}
          autoPlay
          muted
          loop
          playsInline
          onClick={toggle}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <track kind="captions" />
        </video>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg,hsl(var(--brand-primary)),hsl(var(--brand-secondary)))',
          }}
        />
      )}
      {paused ? (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 64,
              height: 64,
              backgroundColor: 'rgba(0,0,0,0.5)',
              border: '3px solid #fff',
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" fill="#fff" />
            </svg>
          </span>
        </button>
      ) : null}
    </div>
  );
}

function GalleryMedia({ post }: { post: SocialPost }) {
  const photos =
    post.galleryUrls && post.galleryUrls.length > 0 ? post.galleryUrls : [post.mediaUrl ?? ''];
  const railRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);

  const goTo = (next: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const n = Math.max(0, Math.min(photos.length - 1, next));
    rail.scrollTo({ left: n * rail.clientWidth, behavior: 'smooth' });
    setIdx(n);
  };
  const onScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    setIdx(Math.round(rail.scrollLeft / rail.clientWidth));
  };

  return (
    <div className="relative">
      <div
        ref={railRef}
        onScroll={onScroll}
        className="scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((src, i) => (
          <span key={i} className="block w-full shrink-0 snap-center">
            <ImageMedia src={src} alt="" />
          </span>
        ))}
      </div>
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full disabled:opacity-30"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => goTo(idx + 1)}
            disabled={idx === photos.length - 1}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full disabled:opacity-30"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Avatar({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
      {failed || !src ? (
        <div
          aria-hidden
          className="h-full w-full"
          style={{ background: 'linear-gradient(135deg,#bbb,#888)' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveAssetUrl(src)}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
