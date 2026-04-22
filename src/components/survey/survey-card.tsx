import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Contenedor visual del survey — card azul centrado en el canvas (1080×1920).
 * Ancho fijo 880px, alto auto, padding generoso.
 */
export function SurveyCard({ children }: Props) {
  return (
    <div
      className="relative mx-auto bg-primary text-primary-foreground shadow-xl"
      style={{
        width: '880px',
        borderRadius: '24px',
        paddingTop: '56px',
        paddingBottom: '56px',
        paddingLeft: '72px',
        paddingRight: '72px',
      }}
    >
      {children}
    </div>
  );
}
