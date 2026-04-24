'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  /** Número actual (3/2/1) — null cuando no está activo. */
  value: number | null;
}

/**
 * Overlay fullscreen con 2 círculos concéntricos + número gigante en el centro.
 * Paths verbatim del SVG `1-Photo_Booth-Countdown-3.svg` (y variantes 2/1).
 * Centro: (540, 1697), r=153, stroke #fff sw=20.
 * Número: font Montserrat-Bold 140px, centrado en (540, ~1720).
 */
export function CountdownOverlay({ value }: CountdownOverlayProps) {
  if (value === null) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ width: 1080, height: 1920 }}
    >
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Fondo círculo (r=153, opacity 0.2) */}
        <g transform="translate(387 1544)" fill="none" stroke="#fff" strokeWidth={20} opacity={0.2}>
          <circle cx={153} cy={153} r={153} />
        </g>
        {/* Arco animado (dasharray "350 2000") */}
        <g transform="translate(387 1544)" fill="none" stroke="#fff" strokeWidth={20}>
          <circle
            cx={153}
            cy={153}
            r={143}
            strokeDasharray="350 2000"
            style={{ transformOrigin: '153px 153px', transform: 'rotate(-90deg)' }}
          />
        </g>
      </svg>
      {/* Número animado (framer-motion) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: 540 - 50,
            top: 1697 - 70,
            width: 100,
            height: 140,
            color: 'hsl(var(--photo-countdown-number))',
            fontFamily: "'Montserrat', system-ui",
            fontSize: 140,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
