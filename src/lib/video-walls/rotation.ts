/**
 * Rotación determinista por reloj para Video Walls (F-SIGNAGE-1/2).
 *
 * A diferencia del `SignagePlayer` (un único display, timer incremental con
 * estado local), un Video Wall se compone de varios TVs físicos y cada uno abre
 * su propia URL `?cell=r,c` con su propio runtime. Para que TODOS los paneles
 * muestren el MISMO slide sin coordinación entre ellos, el índice se deriva del
 * reloj absoluto (epoch), no del tiempo transcurrido desde que cada panel montó.
 * Con relojes NTP-sincronizados (lo normal en TVs de señalización) todas las
 * celdas convergen al mismo slide y cambian a la vez.
 *
 * Funciones puras y deterministas → testeables sin DOM.
 */

/** Suma de duraciones de la playlist (ms). Cada slide cuenta al menos 1ms. */
function totalDurationMs(slides: { durationMs: number }[]): number {
  let total = 0;
  for (const s of slides) total += Math.max(1, s.durationMs);
  return total;
}

/** Offset (no negativo) dentro del ciclo de la playlist para un epoch dado. */
function cycleOffsetMs(slides: { durationMs: number }[], epochMs: number): number {
  const total = totalDurationMs(slides);
  if (total <= 0) return 0;
  return ((epochMs % total) + total) % total;
}

/**
 * Índice del slide que debe estar activo en `epochMs`, recorriendo las
 * duraciones acumuladas dentro del ciclo. Determinista: el mismo epoch produce
 * el mismo índice en cualquier panel.
 */
export function slideIndexAtTime(slides: { durationMs: number }[], epochMs: number): number {
  const n = slides.length;
  if (n === 0) return 0;
  let offset = cycleOffsetMs(slides, epochMs);
  for (let i = 0; i < n; i++) {
    const d = Math.max(1, slides[i].durationMs);
    if (offset < d) return i;
    offset -= d;
  }
  return n - 1;
}

/**
 * Ms restantes hasta el próximo cambio de slide a partir de `epochMs`. Para
 * programar el `setTimeout` de recálculo justo en el borde del slide actual.
 * Devuelve `Infinity` si no hay playlist (no agendar nada).
 */
export function msUntilNextSlide(slides: { durationMs: number }[], epochMs: number): number {
  const n = slides.length;
  if (n === 0) return Number.POSITIVE_INFINITY;
  let offset = cycleOffsetMs(slides, epochMs);
  for (let i = 0; i < n; i++) {
    const d = Math.max(1, slides[i].durationMs);
    if (offset < d) return d - offset;
    offset -= d;
  }
  return totalDurationMs(slides);
}
