interface Props {
  current: number; // 0-based
  total: number;
}

/**
 * Dots grandes del footer, centrados entre BACK y NEXT.
 * Oculto si total<2. Activo = 20×20 filled + ring olive con pulso sutil.
 * Pasados = 16×16 filled. Futuros = 14×14 outline 40% opacity.
 */
export function SurveyProgress({ current, total }: Props) {
  if (total < 2) return null;
  return (
    <div
      className="flex items-center justify-center"
      style={{ gap: '14px' }}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        const size = isActive ? 20 : isPast ? 16 : 14;
        return (
          <span
            key={i}
            aria-hidden
            className={[
              'inline-block rounded-full transition-all duration-500 ease-out',
              isActive ? 'survey-dot-active' : '',
            ].join(' ')}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor:
                isActive || isPast ? 'hsl(var(--primary-foreground))' : 'transparent',
              border: isPast || isActive ? '0' : '2px solid hsl(var(--primary-foreground) / 0.4)',
            }}
          />
        );
      })}
    </div>
  );
}
