/**
 * Piezas del footer comunes a los billboards:
 * - AccessibilityIcon: silueta de persona en silla de ruedas (paths del SVG).
 * - EnglishButton: botón decorativo olive con label "English" y chevron up.
 *
 * Se usan en los footers de B1, B2, B3 y B4 para mantener consistencia
 * con los diseños de referencia.
 */

/**
 * International Symbol of Access (ISA): silueta de persona en silla de
 * ruedas, versión dinámica (ISO 7000-0100). Paths diseñados como una
 * unidad sólida sobre fondo transparente — color por prop.
 */
export function AccessibilityIcon({
  size = 64,
  color = '#fff',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 53.979 54.011"
      fill={color}
      className={className}
      role="img"
      aria-label="Accesibilidad"
    >
      {/* Path verbatim de designs/TNT/Billboard/Wheelchair.svg */}
      <path d="M5.431,48.58A17.893,17.893,0,0,1,0,35.449,18.137,18.137,0,0,1,3.217,24.955a17.685,17.685,0,0,1,8.49-6.7q.421,2.847.949,6.961A12.414,12.414,0,0,0,8.385,29.49,11.7,11.7,0,0,0,10.23,43.781a11.367,11.367,0,0,0,8.332,3.48A11.846,11.846,0,0,0,30.27,37.136H32.8l2.742,5.8a18.576,18.576,0,0,1-6.8,8.016,17.958,17.958,0,0,1-10.178,3.058A17.893,17.893,0,0,1,5.431,48.58Zm38.128,1.054a3.394,3.394,0,0,1-2-1.74L35.015,33.761H20.25a3.229,3.229,0,0,1-2.215-.844,3.459,3.459,0,0,1-1.16-2Q13.5,7.183,13.5,6.761a6.635,6.635,0,0,1,.949-3.48A6.745,6.745,0,0,1,17.033.8,6.457,6.457,0,0,1,20.566.011a6.4,6.4,0,0,1,4.483,2A6.683,6.683,0,0,1,27,6.55a7.3,7.3,0,0,1-.738,3.217A6.383,6.383,0,0,1,21.2,13.406l.528,3.48H35.438a1.626,1.626,0,0,1,1.688,1.688v3.375a1.624,1.624,0,0,1-1.687,1.688H22.676l.527,3.375H37.125a3.2,3.2,0,0,1,1.74.581,3.933,3.933,0,0,1,1.319,1.318L46.2,41.883l3.9-2a1.956,1.956,0,0,1,1.266,0,1.606,1.606,0,0,1,.949.844l1.477,2.954a1.72,1.72,0,0,1,.105,1.319,1.606,1.606,0,0,1-.844,1L46.2,49.476a3.281,3.281,0,0,1-1.481.361A3.523,3.523,0,0,1,43.559,49.634Z" />
    </svg>
  );
}

export function EnglishButton({
  width = 244,
  height = 80,
  fontSize = 26,
  background = '#b9bd39',
}: {
  width?: number;
  height?: number;
  fontSize?: number;
  background?: string;
}) {
  const chevronSize = Math.round(fontSize * 0.7);
  return (
    <div
      className="flex items-center gap-3"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: background,
        borderRadius: '8px',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {/* Globe glyph simple */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={chevronSize}
        height={chevronSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
      </svg>
      <span
        className="font-sans font-bold uppercase text-white"
        style={{ fontSize: `${fontSize}px`, letterSpacing: '0.02em' }}
      >
        English
      </span>
      {/* Chevron up */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={chevronSize}
        height={chevronSize}
        viewBox="0 -12 18 14"
        fill="#fff"
        className="ml-auto"
      >
        <path d="M17.776-3.066l-8.281-8.27a.707.707,0,0,0-1,0L.209-3.066a.721.721,0,0,0,0,1.016L2.062-.209a.707.707,0,0,0,1,0L8.993-6.136,14.919-.209a.707.707,0,0,0,1,0l1.853-1.842A.721.721,0,0,0,17.776-3.066Z" />
      </svg>
    </div>
  );
}
