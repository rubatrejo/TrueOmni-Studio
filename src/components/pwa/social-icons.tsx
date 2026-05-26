/**
 * Iconos sociales del Login (Apple / Facebook / Google), 40×40.
 *
 * Paths extraídos **verbatim** de `designs/mobile-pwa/02-login.svg` con sus
 * `transform` originales; el `viewBox` recorta el bounding box absoluto de
 * cada icono en el canvas 375×812 (evita reescribir coordenadas a mano).
 *
 * White-label: el círculo de Apple usaba `#004e8a` ≈ `--brand-primary`, así que
 * se tokeniza (`hsl(var(--brand-primary))`). Los colores de Facebook (#3c5193)
 * y Google (multicolor) son **logos de marca de terceros** — no son branding
 * del cliente y se mantienen con sus colores oficiales.
 */

interface IconProps {
  className?: string;
  size?: number;
}

export function AppleSocialIcon({ className, size = 40 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="100 272.859 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g transform="translate(-9.5 -24.141)">
        <circle
          cx="20"
          cy="20"
          r="20"
          transform="translate(109.5 297)"
          fill="hsl(var(--brand-primary))"
        />
        <g transform="translate(120.996 306.559)">
          <path
            d="M13.583,10.611a4.415,4.415,0,0,0,2.681,4.041,10.93,10.93,0,0,1-1.382,2.841c-.833,1.217-1.7,2.429-3.058,2.454-1.337.025-1.767-.793-3.3-.793s-2.006.768-3.272.818c-1.314.05-2.314-1.316-3.154-2.528C.386,14.965-.925,10.437.835,7.381a4.89,4.89,0,0,1,4.133-2.5c1.29-.025,2.508.868,3.3.868s2.268-1.073,3.824-.916a4.666,4.666,0,0,1,3.653,1.981,4.517,4.517,0,0,0-2.159,3.8M11.069,3.189A4.4,4.4,0,0,0,12.108,0,4.477,4.477,0,0,0,9.166,1.514,4.18,4.18,0,0,0,8.106,4.6a3.7,3.7,0,0,0,2.963-1.414"
            transform="translate(0)"
            fill="#fff"
          />
        </g>
      </g>
    </svg>
  );
}

export function FacebookSocialIcon({ className, size = 40 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="166 271.859 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* #3c5193 = azul oficial de Facebook (logo de marca, no branding del cliente) */}
      <circle cx="20" cy="20" r="20" transform="translate(166 271.859)" fill="#3c5193" />
      <path
        d="M2.707,18V9.949H0V6.75H2.707V4.219A4.168,4.168,0,0,1,3.832,1.107,4.075,4.075,0,0,1,6.82,0,17.413,17.413,0,0,1,9.281.141V2.988H7.594a1.632,1.632,0,0,0-1.3.422,1.8,1.8,0,0,0-.281,1.125V6.75H9l-.422,3.2H6.012V18Z"
        transform="translate(181 282.859)"
        fill="#fff"
      />
    </svg>
  );
}

export function GoogleSocialIcon({ className, size = 40 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="228 271.859 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Colores oficiales del logo de Google (logo de marca, no branding del cliente) */}
      <circle cx="20" cy="20" r="20" transform="translate(228 271.859)" fill="#fefefe" />
      <g transform="translate(239.068 282.859)">
        <path
          d="M139.19,108.6a7.713,7.713,0,0,0-.19-1.84h-8.45v3.34h4.96a4.4,4.4,0,0,1-1.84,2.92l-.017.112,2.672,2.07.185.018a8.8,8.8,0,0,0,2.68-6.62"
          transform="translate(-121.55 -99.401)"
          fill="#4285f4"
        />
        <path
          d="M21.965,163.59a8.578,8.578,0,0,0,5.96-2.18l-2.84-2.2a5.327,5.327,0,0,1-3.12.9,5.418,5.418,0,0,1-5.12-3.74l-.106.009-2.778,2.15-.036.1a8.993,8.993,0,0,0,8.04,4.96"
          transform="translate(-12.965 -145.59)"
          fill="#34a853"
        />
        <path
          d="M3.88,77.176a5.541,5.541,0,0,1-.3-1.78,5.822,5.822,0,0,1,.29-1.78L3.865,73.5,1.052,71.312l-.092.044a8.981,8.981,0,0,0,0,8.08l2.92-2.26"
          transform="translate(0 -66.396)"
          fill="#fbbc05"
        />
        <path
          d="M21.965,3.48a4.988,4.988,0,0,1,3.48,1.34l2.54-2.48A8.647,8.647,0,0,0,21.965,0a8.993,8.993,0,0,0-8.04,4.96l2.91,2.26a5.44,5.44,0,0,1,5.13-3.74"
          transform="translate(-12.965)"
          fill="#eb4335"
        />
      </g>
    </svg>
  );
}
