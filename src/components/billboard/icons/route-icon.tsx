/**
 * Icono de ruta — paths verbatim del SVG `designs/TNT/Billboard/Itinery-Icon.svg`.
 *
 * Extraído del JSX inline original de Billboard 1 slot 2 para hacerlo
 * reusable como icono del módulo `itinerary-builder` en el catálogo
 * `MODULE_BILLBOARD_INFO`. El path SVG es idéntico al original — solo
 * cambia la envoltura (componente con props `{ size, color }`).
 */
export function RouteIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 101.998 102.58"
      fill={color}
      role="img"
      aria-label="Ruta"
    >
      <g transform="translate(-1.377)">
        <path
          d="M136.294,71.716H101.052a5.914,5.914,0,0,1,0-11.828h29.012a9.517,9.517,0,1,0,12.145-12.145V0H109.857V27.761h26.007V47.744a9.563,9.563,0,0,0-5.8,5.8H101.052a12.259,12.259,0,0,0,0,24.519h35.242a5.914,5.914,0,0,1,0,11.828H77.165a9.518,9.518,0,1,0,0,6.345h59.129a12.259,12.259,0,0,0,0-24.519ZM116.2,21.416V6.345h19.662V21.416Zm22.834,32.127a3.173,3.173,0,1,1-3.173,3.173A3.176,3.176,0,0,1,139.036,53.543ZM68.193,96.235a3.173,3.173,0,1,1,3.173-3.173A3.176,3.176,0,0,1,68.193,96.235Z"
          transform="translate(-45.179)"
        />
        <path
          d="M83.481,161.9a7.4,7.4,0,1,0-7.4,7.4A7.411,7.411,0,0,0,83.481,161.9Z"
          transform="translate(-53.064 -121.821)"
        />
        <path
          d="M39.99,122.237a21.4,21.4,0,0,0,4.66-13.4,21.637,21.637,0,1,0-43.273,0,21.407,21.407,0,0,0,4.666,13.409l16.971,21.337Zm-32.268-13.4a15.292,15.292,0,0,1,30.583,0,15.111,15.111,0,0,1-3.286,9.459L23.014,133.388l-12-15.087A15.116,15.116,0,0,1,7.722,108.836Z"
          transform="translate(0 -68.756)"
        />
      </g>
    </svg>
  );
}
