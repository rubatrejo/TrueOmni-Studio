'use client';

import { GRID_CONFIGS, HEADER_H } from '@/lib/video-walls/dimensions';

import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template placeholder 3×2 — pinta las 6 celdas con su coord (row, col)
 * para verificar que el sistema de canvas + crop funciona. NO se muestra
 * al operador en el AddSlideModal — solo se registra como template
 * default para que un wall recién creado sin slides renderice algo
 * útil para debug.
 *
 * Respeta el header band top (row 0 arranca en y = HEADER_H para no
 * tapar el header continuo).
 */

function Render(_props: VideoWallTemplateRenderProps) {
  const { cols, rows } = GRID_CONFIGS['3x2'];
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      cells.push({ row: r, col: c });
    }
  }
  const hueStep = 360 / (cols * rows);

  return (
    <div className="absolute inset-0">
      {cells.map(({ row, col }, i) => {
        const x = col * 1920;
        const isTopRow = row === 0;
        const y = row * 1080 + (isTopRow ? HEADER_H : 0);
        const h = 1080 - (isTopRow ? HEADER_H : 0);
        const hue = i * hueStep;
        return (
          <div
            key={`${row}-${col}`}
            className="absolute flex items-center justify-center"
            style={{
              left: x,
              top: y,
              width: 1920,
              height: h,
              backgroundColor: `hsl(${hue}, 55%, 35%)`,
              color: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 280,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            {row},{col}
          </div>
        );
      })}
    </div>
  );
}

const PlaceholderTemplate3x2: VideoWallTemplate = {
  id: '00-placeholder',
  label: '00 · Placeholder',
  category: 'placeholder',
  grid: '3x2',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 3 },
      acceptedModules: [],
    },
  ],
  Render,
};

registerTemplate(PlaceholderTemplate3x2);

export default PlaceholderTemplate3x2;
