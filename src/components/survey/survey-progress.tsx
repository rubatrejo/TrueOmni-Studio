interface Props {
  current: number; // 0-based
  total: number;
}

/**
 * Progress dots top del card. Oculto si total<2.
 * Activo = dot más grande + ring olive con pulso sutil.
 * Pasados = filled blanco.
 * Futuros = outline 40% opacity.
 */
export function SurveyProgress({ current, total }: Props) {
  if (total < 2) return null;
  return (
    <div
      className="flex items-center justify-center"
      style={{ gap: '20px', marginTop: '8px' }}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <span
            key={i}
            aria-hidden
            className={[
              'inline-block rounded-full transition-all duration-500 ease-out',
              isActive ? 'survey-dot-active' : '',
            ].join(' ')}
            style={{
              width: isActive ? '14px' : '10px',
              height: isActive ? '14px' : '10px',
              backgroundColor:
                isActive || isPast ? 'hsl(var(--primary-foreground))' : 'transparent',
              border: isPast || isActive ? '0' : '2px solid hsl(var(--primary-foreground) / 0.35)',
            }}
          />
        );
      })}
    </div>
  );
}
