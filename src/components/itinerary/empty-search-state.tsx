'use client';

/**
 * Empty state mostrado en el sidebar de listings cuando la búsqueda no
 * arroja resultados. Pixel-close al SVG `Trip Builder - Nothing Found`:
 *   - Ilustración folder con slash (rojo `--itinerary-empty-icon`).
 *   - Título "Ooops! Try again" Montserrat Bold 26px.
 *   - Body 4 líneas Montserrat Regular ~17px gris muted.
 */
export interface EmptySearchStateProps {
  title: string;
  body: string;
}

export function EmptySearchState({ title, body }: EmptySearchStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ paddingTop: 60, paddingLeft: 12, paddingRight: 12, gap: 18 }}
    >
      <OopsIcon />
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '0.01em',
          color: 'hsl(var(--foreground))',
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          lineHeight: 1.45,
          color: 'hsl(var(--itinerary-slot-helper-text) / 0.55)',
          margin: 0,
          whiteSpace: 'pre-line',
        }}
      >
        {body}
      </p>
    </div>
  );
}

/**
 * Icono "Ooops" — folder con stroke + slash diagonal sobre la pestaña.
 * Verbatim del SVG `Trip Builder - Nothing Found.svg` (group
 * `noun-oops-5405055`, paths `Path_32067` + `Path_32071`).
 */
function OopsIcon() {
  return (
    <svg width="130" height="130" viewBox="0 0 128 128" fill="none" aria-hidden="true" role="img">
      <g transform="translate(2 13)">
        <path
          d="M.029,103.288a1.972,1.972,0,0,0,.068.3c.014.044.024.089.041.132a1.994,1.994,0,0,0,.5.736c.034.032.071.059.107.088A2,2,0,0,0,1,104.72c.043.025.086.049.131.071a1.981,1.981,0,0,0,.3.115c.042.013.082.029.124.039A1.992,1.992,0,0,0,2,105H88.684a2,2,0,0,0,1.854-1.248l14.14-34.864a24.852,24.852,0,0,1-4.028-.708L87.337,101H4.967L23.58,55l60.947-.058A24.832,24.832,0,0,1,83,51H23.58a4,4,0,0,0-3.753,2.577L4,92.718V35a2,2,0,0,1,2-2H38.343a1.989,1.989,0,0,1,1.415.586l5.656,5.656A5.96,5.96,0,0,0,49.657,41H82.186A24.809,24.809,0,0,1,83,37H49.657a1.989,1.989,0,0,1-1.415-.586l-5.656-5.656A5.96,5.96,0,0,0,38.343,29H6a6.007,6.007,0,0,0-6,6v68c0,.041.01.08.012.121C.016,103.177.021,103.232.029,103.288Z"
          fill="hsl(var(--itinerary-empty-icon))"
        />
        <path
          d="M128,44a21,21,0,1,0-21,21,21,21,0,0,0,21-21Zm-4,0a16.9,16.9,0,0,1-3.664,10.509L96.491,30.663A16.975,16.975,0,0,1,124,44ZM90,44a16.9,16.9,0,0,1,3.664-10.509l23.845,23.846A16.975,16.975,0,0,1,90,44Z"
          fill="hsl(var(--itinerary-empty-icon))"
        />
      </g>
    </svg>
  );
}
