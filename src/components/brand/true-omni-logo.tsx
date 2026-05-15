/**
 * Logo TrueOmni — wordmark + icono geométrico.
 *
 * Extraído 1:1 de `designs/TNT/Billboard/Billboard 0.svg` (Group_3571,
 * Logo-White-Footer). Los paths conservan sus `transform` originales para
 * que las coordenadas sean idénticas al archivo fuente sin reescritura
 * manual (evita errores de traslación).
 *
 * Todos los paths usan `fill="currentColor"` para que el color se controle
 * desde CSS/Tailwind (ej. `text-white`, `text-primary`).
 *
 * viewBox: 353.697 × 65.369 (Rectangle_37 del SVG, bounding box natural).
 * Ajusta tamaño vía `className` (ej. `h-16 w-auto`).
 *
 * Es un Client Component porque escucha `kiosk:logo-override` (emitido por
 * StudioBridge cuando el editor del Studio sube un nuevo logo). Si hay
 * override, se renderea como `<img>` en lugar del SVG inline.
 */
'use client';

import { memo, useEffect, useState } from 'react';

import { getCachedLogoOverride } from '@/components/studio-bridge';

interface TrueOmniLogoProps {
  /** Clase Tailwind para controlar tamaño/color. Ej: `h-16 w-auto text-white`. */
  className?: string;
  /** Etiqueta a11y. Por defecto "TrueOmni". */
  title?: string;
  /**
   * Qué override del Studio escucha:
   *   - `default` (default): logo principal (header del Home, módulos).
   *   - `idle`: logo grande del Billboard idle (centro de pantalla).
   *   - `footer`: logo del footer del Billboard idle (banda inferior).
   *   - `brand`: NUNCA se sobrescribe (Powered by TrueOmni — marca propia).
   */
  slot?: 'default' | 'idle' | 'footer' | 'brand';
  /**
   * Alineación del logo dentro de su bounding box cuando el aspect ratio
   * del logo es menor que el del slot (logos más cuadrados o más estrechos).
   *  - `center` (default): comportamiento histórico — centra horizontalmente.
   *  - `left`: alinea a la izquierda del slot, útil en headers donde el logo
   *    debe pegarse al borde izquierdo aunque sea más corto que el espacio
   *    reservado.
   */
  align?: 'left' | 'center';
}

function TrueOmniLogoBase({
  className,
  title = 'TrueOmni',
  slot = 'default',
  align = 'center',
}: TrueOmniLogoProps) {
  const [override, setOverride] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (slot === 'brand') return; // Powered by TrueOmni nunca cambia.
    // Lee la cache global por si el bridge ya despachó antes de este mount
    // (caso típico: cambio de ruta dentro del iframe del Studio).
    const cached = getCachedLogoOverride(slot as 'default' | 'idle' | 'footer');
    if (cached) setOverride(cached);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slot?: string; logo?: string }>).detail;
      // Ignorar overrides de otro slot.
      const evtSlot = detail?.slot ?? 'default';
      if (evtSlot !== slot) return;
      const next = detail?.logo;
      setOverride(next && next.length > 0 ? next : null);
    };
    window.addEventListener('kiosk:logo-override', handler);
    return () => window.removeEventListener('kiosk:logo-override', handler);
  }, [slot]);

  if (override) {
    // El logo subido por el usuario suele ser un raster con aspect ratio propio.
    // `object-contain` + `block` evita stretching y mantiene el aspect dentro
    // del bounding box que dicta `className` (h-X w-auto).
    //
    // Si el override es un PNG/JPG cuadrado (1:1), `w-auto` lo encoge a ser
    // = a la altura → logo se ve diminuto en headers anchos. Forzamos
    // min-width a 4× la altura del componente para garantizar visibilidad
    // mínima razonable, dejando que `object-contain` mantenga el aspect.
    //
    // `align="left"` mueve el `object-contain` al borde izquierdo en lugar
    // del centro — clave para headers que reservan un slot ancho y quieren
    // que el logo se pegue a la izquierda aunque sea más estrecho.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={override}
        alt={title}
        className={`${className ?? ''} block object-contain ${
          align === 'left' ? 'object-left' : 'object-center'
        }`}
        style={{ minWidth: '120px' }}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 353.697 65.369"
      preserveAspectRatio={align === 'left' ? 'xMinYMid meet' : 'xMidYMid meet'}
      role="img"
      aria-label={title}
      className={className}
      fill="currentColor"
    >
      <title>{title}</title>

      {/* Wordmark: T r u e O m n i (orden según SVG original) */}
      <path
        d="M249.069,52.364a15.4,15.4,0,0,0-6.351,1.37,8.013,8.013,0,0,0-4.021,3.933V76.137h-7.808V45.6h7.167v6.526a13.915,13.915,0,0,1,1.923-2.826,14.786,14.786,0,0,1,2.389-2.185,11.057,11.057,0,0,1,2.593-1.428,7.156,7.156,0,0,1,2.535-.5h.961a3.178,3.178,0,0,1,.612.058Z"
        transform="translate(-113.467 -22.211)"
      />
      <path
        d="M287.134,77.114q-4.72,0-7.167-3.03t-2.447-8.973V46h7.808V63.421q0,7.051,5.069,7.051a8.017,8.017,0,0,0,4.4-1.37,9.841,9.841,0,0,0,3.467-4.166V46h7.808V67.558a2.743,2.743,0,0,0,.437,1.748,1.909,1.909,0,0,0,1.428.583v6.642a16.637,16.637,0,0,1-1.952.291c-.525.038-1,.058-1.428.058a5.622,5.622,0,0,1-3.408-.962,3.783,3.783,0,0,1-1.544-2.651l-.175-2.447a13.017,13.017,0,0,1-5.244,4.719,15.775,15.775,0,0,1-7.05,1.574"
        transform="translate(-136.385 -22.605)"
      />
      <path
        d="M364.065,76.607a16.952,16.952,0,0,1-6.642-1.253,14.982,14.982,0,0,1-8.3-8.42,16.073,16.073,0,0,1-1.136-6,17,17,0,0,1,1.107-6.147,15,15,0,0,1,3.2-5.069,15.293,15.293,0,0,1,5.1-3.467,16.976,16.976,0,0,1,6.73-1.282,16.555,16.555,0,0,1,6.671,1.282,15.365,15.365,0,0,1,5.011,3.437,14.641,14.641,0,0,1,3.146,5.011,16.7,16.7,0,0,1,1.078,5.944q0,.758-.029,1.457a5.983,5.983,0,0,1-.146,1.166h-23.6a9.051,9.051,0,0,0,.874,3.2,7.846,7.846,0,0,0,4.312,3.9,8.235,8.235,0,0,0,2.914.524,9.008,9.008,0,0,0,4.4-1.136,6.017,6.017,0,0,0,2.826-3l6.7,1.865a13.62,13.62,0,0,1-5.39,5.739,16.707,16.707,0,0,1-8.828,2.243m7.924-18.412a8.124,8.124,0,0,0-2.535-5.506,7.954,7.954,0,0,0-10.808.029,7.994,7.994,0,0,0-1.719,2.389,8.407,8.407,0,0,0-.787,3.088Z"
        transform="translate(-171.012 -22.1)"
      />
      <path
        d="M440.655,66.067a17.1,17.1,0,0,1-7.866-1.806,20.306,20.306,0,0,1-6.119-4.72,21.083,21.083,0,0,1-3.962-6.7,22.2,22.2,0,0,1-1.4-7.749,21.507,21.507,0,0,1,1.486-7.924,22.161,22.161,0,0,1,4.079-6.7,19.517,19.517,0,0,1,6.147-4.632,17.429,17.429,0,0,1,7.691-1.719,17.063,17.063,0,0,1,7.9,1.835,19.833,19.833,0,0,1,6.119,4.807,22.218,22.218,0,0,1,3.933,6.73,21.91,21.91,0,0,1-4.166,22.259,19.738,19.738,0,0,1-6.147,4.6,17.43,17.43,0,0,1-7.691,1.718M424.282,45.091a19.9,19.9,0,0,0,1.195,6.847,18.468,18.468,0,0,0,3.379,5.827,16.628,16.628,0,0,0,5.215,4.05,14.632,14.632,0,0,0,6.642,1.515,14.277,14.277,0,0,0,6.73-1.573,16.427,16.427,0,0,0,5.128-4.166A19.753,19.753,0,0,0,455.8,38.245a18.959,18.959,0,0,0-3.408-5.827,16.868,16.868,0,0,0-5.157-4.049,14.158,14.158,0,0,0-6.526-1.515,14.446,14.446,0,0,0-6.759,1.573,16.648,16.648,0,0,0-5.186,4.166,19.139,19.139,0,0,0-3.321,5.856,19.592,19.592,0,0,0-1.166,6.642"
        transform="translate(-207.047 -11.852)"
      />
      <path
        d="M556.566,76.249h-2.913v-16.9q0-5.768-1.777-8.507a6.044,6.044,0,0,0-5.448-2.739,9.2,9.2,0,0,0-3.554.7,10.768,10.768,0,0,0-3.088,1.952,12.58,12.58,0,0,0-2.418,2.972,15.635,15.635,0,0,0-1.6,3.817v18.7h-2.914v-16.9q0-5.825-1.747-8.536a5.992,5.992,0,0,0-5.419-2.71,9.339,9.339,0,0,0-3.525.67A10.389,10.389,0,0,0,519.1,50.7a13.811,13.811,0,0,0-2.476,2.972,14.349,14.349,0,0,0-1.661,3.816V76.249H512.05V45.95h2.738v7.225a14.755,14.755,0,0,1,4.895-5.71,11.741,11.741,0,0,1,6.7-2.039,8.674,8.674,0,0,1,6.234,2.272,9.584,9.584,0,0,1,2.856,5.943q4.311-8.216,11.886-8.215,4.952,0,7.08,3.525t2.127,9.877Z"
        transform="translate(-251.641 -22.324)"
      />
      <path
        d="M642.221,76.249h-2.913v-16.9q0-5.884-1.661-8.565a5.745,5.745,0,0,0-5.273-2.681,10.94,10.94,0,0,0-3.817.7,12.915,12.915,0,0,0-3.525,1.981,14.469,14.469,0,0,0-2.855,3,12.36,12.36,0,0,0-1.806,3.7V76.249h-2.913V45.95H620.2v7.225A14.242,14.242,0,0,1,622.5,50a14.509,14.509,0,0,1,3.089-2.447,15.563,15.563,0,0,1,3.641-1.573,14.262,14.262,0,0,1,3.962-.553q4.952,0,6.992,3.467t2.039,9.935Z"
        transform="translate(-303.441 -22.324)"
      />
      <rect width="2.913" height="30.299" transform="translate(347.869 23.627)" />

      {/* Icono geométrico (lado izquierdo del wordmark) */}
      <path
        d="M58.577,85.644a11.622,11.622,0,0,1-5.816-1.559l-9.13,9.13a24.311,24.311,0,0,0,30.1-.156l-9.111-9.111a11.623,11.623,0,0,1-6.043,1.7"
        transform="translate(-21.441 -41.256)"
      />
      <path
        d="M58.6,16.305a24.268,24.268,0,0,0-14.922,5.123L52.81,30.56a11.623,11.623,0,0,1,11.806.137l9.114-9.113A24.281,24.281,0,0,0,58.6,16.305"
        transform="translate(-21.465 -8.014)"
      />
      <path
        d="M105.225,42.3a24.169,24.169,0,0,0-.006-19.222L120.083,0,102.11,17.8c-.013-.017-.024-.035-.037-.051l-9.13,9.13a11.634,11.634,0,0,1,.016,11.606h0l-.017,0L94.877,40.4l7.215,7.215c.01-.013.019-.027.029-.04l17.962,17.791Z"
        transform="translate(-45.676)"
      />
      <path d="M14.858,42.3a24.169,24.169,0,0,1,.006-19.222L0,0,17.973,17.8c.013-.017.024-.035.037-.051l9.13,9.13a11.634,11.634,0,0,0-.016,11.606h0l.017,0L25.206,40.4l-7.215,7.215c-.01-.013-.019-.027-.029-.04L0,65.369Z" />
      <path
        d="M176.7,28a4.188,4.188,0,1,1-4.188-4.188A4.188,4.188,0,0,1,176.7,28"
        transform="translate(-82.719 -11.703)"
      />
      <path
        d="M687.391,28.941a4.188,4.188,0,1,1-4.188-4.188,4.188,4.188,0,0,1,4.188,4.188"
        transform="translate(-333.693 -12.164)"
      />

      {/* Letra T (Path_2703 en el SVG) */}
      <path
        d="M211.539,31.738H198.312v34.32h-7.983V31.738h.077v-7.05h21.132Z"
        transform="translate(-93.535 -12.133)"
      />
    </svg>
  );
}

/**
 * Wrapper memoizado (audit F-42). Evita re-render del SVG inline en cada
 * navegación cuando los props no cambian. Importante porque el SVG son ~50
 * paths inline y el TopBar lo renderiza en cada page change.
 */
export const TrueOmniLogo = memo(TrueOmniLogoBase);
