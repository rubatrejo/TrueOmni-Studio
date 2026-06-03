'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface WayfindingAmenityCardProps {
  slug: string;
  name: string;
  image: string;
}

/**
 * Card panorámica con imagen de fondo + nombre centrado. Verbatim del XD:
 * h=100px, bordes redondeados 14px, overlay oscuro 30%, texto blanco bold
 * uppercase centrado, sombra sutil. Al tap → /pwa/wayfinding/[slug].
 */
export function WayfindingAmenityCard({ slug, name, image }: WayfindingAmenityCardProps) {
  const router = useRouter();
  const src = resolveAssetUrl(image);

  return (
    <button
      type="button"
      onClick={() => router.push(`/pwa/wayfinding/${slug}`)}
      className="relative h-[144px] w-full overflow-hidden rounded-[14px] bg-cover bg-center shadow-sm"
      style={{ backgroundImage: `url(${src})` }}
    >
      <span className="absolute inset-0 rounded-[14px] bg-black/30" />
      <span
        className="absolute inset-0 flex items-center justify-center px-5 text-center text-[18px] font-bold uppercase leading-tight tracking-wider text-white drop-shadow-md"
        style={OPEN_SANS}
      >
        {name}
      </span>
    </button>
  );
}
