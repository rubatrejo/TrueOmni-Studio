interface Props {
  current: number; // 0-based index
  total: number;
}

/**
 * Dots arriba del card. Oculto si total<2. Activo = filled white + ring olive.
 * Pasados = filled white. Futuros = hollow (border white 40% opacity).
 */
export function SurveyProgress({ current, total }: Props) {
  if (total < 2) return null;
  const dots = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="mb-10 flex items-center justify-center" style={{ gap: '16px' }}>
      {dots.map((i) => {
        const isActive = i === current;
        const isPast = i < current;
        const size = isActive ? 16 : 12;
        return (
          <span
            key={i}
            aria-hidden
            className="inline-block rounded-full transition-all"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor:
                isActive || isPast ? 'hsl(var(--primary-foreground))' : 'transparent',
              boxShadow: isActive ? '0 0 0 3px hsl(var(--accent))' : 'none',
              border:
                isPast || isActive ? 'none' : '2px solid hsl(var(--primary-foreground) / 0.4)',
            }}
          />
        );
      })}
    </div>
  );
}
