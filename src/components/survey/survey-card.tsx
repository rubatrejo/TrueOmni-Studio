import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Card cinematic del survey — altura FIJA para todos los pasos.
 * 768×1152 (20% más pequeño que la V2).
 * Gradient radial top-center + glow esquina + shadow 2xl coloreado.
 */
export function SurveyCard({ children }: Props) {
  return (
    <div
      className="survey-card-anim relative mx-auto flex flex-col overflow-hidden text-primary-foreground"
      style={{
        width: '768px',
        height: '806px',
        borderRadius: '28px',
        backgroundColor: 'hsl(var(--primary))',
        backgroundImage:
          'radial-gradient(ellipse 120% 80% at 50% -10%, hsl(var(--primary-foreground) / 0.18), transparent 55%), linear-gradient(180deg, hsl(var(--primary) / 0.2) 0%, transparent 40%)',
        boxShadow:
          '0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--primary-foreground) / 0.08), 0 0 120px -20px hsl(var(--primary) / 0.6)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: '-100px',
          right: '-100px',
          width: '340px',
          height: '340px',
          background:
            'radial-gradient(circle, hsl(var(--primary-foreground) / 0.15), transparent 65%)',
          filter: 'blur(36px)',
        }}
      />
      {children}
    </div>
  );
}
