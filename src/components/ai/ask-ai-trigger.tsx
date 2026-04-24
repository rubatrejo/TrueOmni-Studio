'use client';

import { motion } from 'framer-motion';

import { useAiStore } from '@/stores/ai-store';

interface AskAiTriggerProps {
  /** Path absoluto del avatar/trigger (ej. `/assets/ai/trigger.svg`). */
  avatarSrc: string;
  /** aria-label desde `textos.ai_aria_open`. */
  ariaLabel: string;
  /** Ancho del trigger en px. Si no se declara, se infiere del `size` (cuadrado). */
  width?: number;
  /** Alto del trigger en px. Si no se declara, se infiere del `size` (cuadrado). */
  height?: number;
  /** Tamaño del trigger circular cuadrado (legacy). Default 82. */
  size?: number;
  /** Posicionamiento absoluto. Default `right:24, bottom:24`. */
  position?: { right?: number; bottom?: number };
  /** Si true, recorta a círculo (default cuando width === height). */
  circular?: boolean;
}

/**
 * Botón flotante que abre el AiModal. Soporta dos formas:
 *   - Cuadrado/circular: declarar `size` (ej. avatar PNG 82×82 → círculo).
 *   - Rectangular (pastilla, banner, etc.): declarar `width`/`height` con
 *     un asset que ya traiga su propia forma + sombra (ej. SVG con shadow
 *     embebido). En este modo no se aplica overflow:hidden ni rounded-full.
 */
export function AskAiTrigger({
  avatarSrc,
  ariaLabel,
  width,
  height,
  size = 82,
  position = { right: 24, bottom: 24 },
  circular,
}: AskAiTriggerProps) {
  const openAi = useAiStore((s) => s.open);
  const w = width ?? size;
  const h = height ?? size;
  const isCircular = circular ?? w === h;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={openAi}
      aria-label={ariaLabel}
      className="absolute z-40 flex items-center justify-center"
      style={{
        right: position.right,
        bottom: position.bottom,
        width: w,
        height: h,
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {isCircular ? (
        <span
          className="relative block overflow-hidden rounded-full"
          style={{
            width: w,
            height: h,
            boxShadow: '0 8px 24px hsl(var(--ai-trigger-shadow) / 0.28)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt=""
            width={w}
            height={h}
            className="block h-full w-full rounded-full object-cover"
          />
        </span>
      ) : (
        // Rectangular (pastilla / banner): el asset trae su propia forma y
        // sombra, así que NO aplicamos overflow ni shadow extra.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt=""
          width={w}
          height={h}
          style={{ width: w, height: h, display: 'block' }}
        />
      )}
    </motion.button>
  );
}
