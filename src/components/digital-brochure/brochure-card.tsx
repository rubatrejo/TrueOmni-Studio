'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { BrochureItem } from '@/lib/config';

/**
 * Card horizontal de un brochure en el listado.
 *   Cover 120×160 izq + categoría + título + descripción + fecha a la derecha.
 *   Fondo `#f0f0f0`, borde redondeado suave.
 */
export function BrochureCard({
  brochure,
  moduleKey,
}: {
  brochure: BrochureItem;
  moduleKey: string;
}) {
  return (
    <Link
      href={`/home/${moduleKey}/${brochure.slug}`}
      aria-label={`Abrir ${brochure.title}`}
      className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
    >
      <div
        className="flex items-stretch overflow-hidden"
        style={{
          width: '880px',
          height: '300px',
          marginBottom: '26px',
          backgroundColor: '#f0f0f0',
          borderRadius: '6px',
        }}
      >
        <Cover src={brochure.cover} alt={brochure.title} />
        <div
          className="flex flex-col justify-center"
          style={{ flex: 1, padding: '26px 34px', rowGap: '10px' }}
        >
          <span
            className="font-sans"
            style={{
              fontSize: '18px',
              lineHeight: '18px',
              color: '#4a4a4a',
              fontWeight: 400,
            }}
          >
            {brochure.category}
          </span>
          <span
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '32px',
              lineHeight: '38px',
              color: '#1a1a1a',
              fontWeight: 700,
            }}
          >
            {brochure.title}
          </span>
          <p
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '20px',
              lineHeight: '26px',
              color: '#5e5e5e',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {brochure.description}
          </p>
          <span
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '17px',
              lineHeight: '17px',
              color: '#6e6e6e',
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            {brochure.publishedLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Cover({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  // Thumbnail ratio A4 portrait (210:297 ≈ 0.707). Height 300 ⇒ width 212.
  const style = { width: '212px', height: '300px', flexShrink: 0 } as const;
  if (failed || !src) {
    return (
      <div
        aria-hidden
        style={{ ...style, background: 'linear-gradient(135deg, hsl(var(--brand-primary)), #1796d6)' }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ ...style, objectFit: 'cover' }}
    />
  );
}
