'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface CountdownOverlayProps {
  /** Número actual (3/2/1) — null cuando no está activo. */
  value: number | null;
  /** Total de segundos iniciales del countdown. Usado para animar el
   *  progreso del ring de 0 → 100% de manera proporcional. */
  totalSeconds: number;
}

// Círculo del ring: cx=153, cy=153, r=143, stroke-width=20.
// Circumference ≈ 2π * 143 ≈ 898.58.
const RING_CIRCUMFERENCE = 2 * Math.PI * 143;

/**
 * Overlay fullscreen con 2 círculos concéntricos + número gigante en el
 * centro. Paths verbatim del SVG `1-Photo_Booth-Countdown-3.svg`. El ring
 * interior se va rellenando linealmente durante el countdown: empieza en
 * 0% (stroke invisible) y termina en 100% (stroke completo) cuando el
 * contador llega a 0.
 */
export function CountdownOverlay({ value, totalSeconds }: CountdownOverlayProps) {
  if (value === null) return null;

  // Progreso 0..1 basado en cuánto ha pasado. value=totalSeconds → 0%,
  // value=1 → (totalSeconds-1)/totalSeconds ≈ 100% cuando cuenta a 0.
  // Usamos (totalSeconds - value + 1) para que el último tick (value=1)
  // llegue cerca del 100% visualmente.
  const elapsed = Math.max(0, totalSeconds - value + 1);
  const progress = Math.min(1, elapsed / totalSeconds);
  const dashoffset = RING_CIRCUMFERENCE * (1 - progress);

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
        {/* Backdrop negro 50% — para que el círculo y el número sean
            legibles cuando hay un frame con muchos detalles atrás. */}
        <g transform="translate(387 1544)">
          <circle cx={153} cy={153} r={153} fill="rgba(0,0,0,0.5)" />
        </g>
        {/* Track del ring (verde 20% opacidad) */}
        <g
          transform="translate(387 1544)"
          fill="none"
          stroke="hsl(var(--photo-countdown-ring))"
          strokeWidth={20}
          opacity={0.2}
        >
          <circle cx={153} cy={153} r={153} />
        </g>
        {/* Arco de progreso que se rellena linealmente durante el countdown.
            Color olive verde tomado del Send-to-Phone (hsl(var(--brand-tertiary))). */}
        <g
          transform="translate(387 1544)"
          fill="none"
          stroke="hsl(var(--photo-countdown-ring))"
          strokeWidth={20}
          strokeLinecap="round"
        >
          <motion.circle
            cx={153}
            cy={153}
            r={143}
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={false}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{
              transformOrigin: '153px 153px',
              transform: 'rotate(-90deg)',
            }}
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
            color: 'hsl(var(--photo-countdown-ring))',
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
