'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { useAiStore } from '@/stores/ai-store';

interface AskAiTriggerProps {
  /** Path absoluto del avatar (ej. `/assets/ai/avatar.png`). */
  avatarSrc: string;
  /** aria-label desde `textos.ai_aria_open`. */
  ariaLabel: string;
  /** Tamaño del avatar en px. Default 82. */
  size?: number;
  /** Posicionamiento absoluto. Default `right:24, bottom:24`. */
  position?: { right?: number; bottom?: number };
}

/**
 * Botón flotante circular que abre el AiModal. Posicionado absoluto sobre
 * el `KioskCanvas`. Lee `open` del store; visualmente es un Image circular
 * con sombra suave.
 */
export function AskAiTrigger({
  avatarSrc,
  ariaLabel,
  size = 82,
  position = { right: 24, bottom: 24 },
}: AskAiTriggerProps) {
  const openAi = useAiStore((s) => s.open);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={openAi}
      aria-label={ariaLabel}
      className="absolute z-40 flex flex-col items-center"
      style={{
        right: position.right,
        bottom: position.bottom,
        width: size,
        height: size,
      }}
    >
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: '0 8px 24px hsl(var(--ai-trigger-shadow) / 0.28)',
        }}
      >
        <Image
          src={avatarSrc}
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover"
          unoptimized
          priority
        />
      </div>
    </motion.button>
  );
}
