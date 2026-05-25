import type { HomeTile } from '@/lib/config';

import { CategoryTile } from './category-tile';

interface Props {
  tiles: readonly HomeTile[];
  /** Callback para el tile cuya key === 'survey'. Si null, tile actúa como link normal. */
  onSurveyTap?: () => void;
  /** Tamaño global de la tipografía de los títulos de los tiles (px). */
  titleFontSize?: number;
}

/**
 * Grid verbatim del SVG: 2 columnas con tiles de 460×460, gap 30px horizontal
 * y vertical. Total ancho: 460+30+460 = 950 centrado en el canvas con 64px
 * padding-left (y 66px padding-right para totalizar 1080).
 */
export function CategoryGrid({ tiles, onSurveyTap, titleFontSize }: Props) {
  return (
    <div
      className="grid grid-cols-2"
      style={{
        columnGap: '30px',
        rowGap: '30px',
        width: '950px',
        marginLeft: '64px',
        marginRight: '66px',
      }}
    >
      {tiles.map((tile) => (
        <CategoryTile
          key={tile.key}
          tile={tile}
          onClick={tile.key === 'survey' && onSurveyTap ? onSurveyTap : undefined}
          titleFontSize={titleFontSize}
        />
      ))}
    </div>
  );
}
