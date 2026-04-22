import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Contenedor cinematic del survey — card azul centrado en el canvas
 * 1080×1920. Altura FIJA 1440px (todos los pasos ocupan el mismo bloque).
 * Gradient radial desde top-center para dar depth premium.
 * Glow coloreado + shadow 2xl para jerarquía máxima.
 */
export function SurveyCard({ children }: Props) {
  return (
    <div
      className="survey-card-anim relative mx-auto flex flex-col overflow-hidden text-primary-foreground"
      style={{
        width: '960px',
        height: '1440px',
        borderRadius: '32px',
        backgroundColor: 'hsl(var(--primary))',
        backgroundImage:
          'radial-gradient(ellipse 120% 80% at 50% -10%, hsl(var(--primary-foreground) / 0.18), transparent 55%), linear-gradient(180deg, hsl(var(--primary) / 0.2) 0%, transparent 40%)',
        boxShadow:
          '0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--primary-foreground) / 0.08), 0 0 120px -20px hsl(var(--primary) / 0.6)',
      }}
    >
      {/* Luz sutil en la esquina superior — toque cinematic */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: '-120px',
          right: '-120px',
          width: '420px',
          height: '420px',
          background:
            'radial-gradient(circle, hsl(var(--primary-foreground) / 0.15), transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      {children}
    </div>
  );
}
