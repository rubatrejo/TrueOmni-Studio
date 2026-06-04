'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Paleta tokenizada: colores de marca + acentos funcionales ya existentes
// (cero hex inventados — cada cliente recolorea el confeti vía sus tokens).
const COLORS = [
  'hsl(var(--brand-primary))',
  'hsl(var(--brand-tertiary))',
  'hsl(var(--brand-secondary))',
  'hsl(var(--pwa-success))',
  'hsl(var(--pwa-favorite))',
  'hsl(var(--pwa-events-pin))',
];
const PARTICLE_COUNT = 30;

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

/**
 * Efecto de confetti al completar una task (mejora C). Partículas animadas
 * con framer-motion springs que caen desde arriba.
 */
export function HuntConfetti() {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: randomBetween(5, 95),
        color: COLORS[i % COLORS.length],
        delay: randomBetween(0, 0.5),
        size: randomBetween(6, 12),
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -20, x: `${p.x}%`, opacity: 1, rotate: 0 }}
            animate={{ y: '110%', opacity: 0, rotate: randomBetween(-180, 180) }}
            transition={{ duration: randomBetween(1.5, 2.5), delay: p.delay, ease: 'easeIn' }}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.size > 9 ? 2 : '50%',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
