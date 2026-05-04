'use client';

import type { CSSProperties, ReactNode } from 'react';

export interface CarouselOption {
  id: string;
  imageSrc?: string;
  label: string;
  /** Si true, renderiza el círculo con un estilo "agregar/nuevo" (plus icon). */
  addButton?: boolean;
  /** Preview visual opcional — overrides imageSrc con estilo custom (ej. CSS filter). */
  previewStyle?: CSSProperties;
}

interface OptionsCarouselProps {
  /** Opciones a mostrar en la fila circular (180×180 con stroke blanco). */
  options: CarouselOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Render custom del contenido de un círculo (usado por Filters para aplicar
   *  CSS filter a una imagen preview). Por default pinta imageSrc con cover. */
  renderInside?: (option: CarouselOption) => ReactNode;
}

/**
 * Carrusel horizontal scrollable de opciones del editor (Backgrounds / Frames
 * / Filters). Coordenadas verbatim del SVG `4-Photo_Booth-Experience.svg`:
 *   - Fila entera en la zona superior blue hsl(var(--brand-primary)) (y=178+4=182, h~230).
 *   - Círculos r=106 con stroke #fff sw=10.
 *   - Inside: rect 180×180 rx=90 con pattern fill.
 *
 * Reimplementado como flex horizontal scrollable para que el kiosk soporte
 * catálogos grandes del cliente sin limitarse a los 6 slots fijos del SVG.
 */
export function OptionsCarousel({
  options,
  selectedId,
  onSelect,
  renderInside,
}: OptionsCarouselProps) {
  return (
    <div
      className="absolute overflow-x-auto"
      style={{
        left: 0,
        top: 182,
        width: 1080,
        height: 260,
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        padding: '20px 48px',
        background: 'hsl(var(--photo-tabs-bg))',
        scrollbarWidth: 'none',
      }}
    >
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            aria-label={opt.label}
            onClick={() => onSelect(opt.id)}
            style={{
              flex: '0 0 auto',
              width: 200,
              height: 200,
              padding: 0,
              borderRadius: '50%',
              border: '10px solid #fff',
              background: '#fff',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: selected ? '0 0 0 8px hsl(var(--photo-accent-from))' : undefined,
              transition: 'box-shadow 0.15s ease-out',
            }}
          >
            {renderInside ? (
              renderInside(opt)
            ) : opt.addButton ? (
              <svg width={100} height={100} viewBox="0 0 100 100" aria-hidden="true">
                <line x1={50} y1={20} x2={50} y2={80} stroke="#fff" strokeWidth={12} strokeLinecap="round" />
                <line x1={20} y1={50} x2={80} y2={50} stroke="#fff" strokeWidth={12} strokeLinecap="round" />
              </svg>
            ) : opt.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opt.imageSrc}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
