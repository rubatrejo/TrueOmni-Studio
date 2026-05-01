/**
 * Icono de cámara — paths verbatim del SVG `designs/TNT/Billboard/Photo_Booth-Icon.svg`.
 *
 * Extraído del JSX inline original de Billboard 1 slot 3 para hacerlo
 * reusable como icono del módulo `photo-booth` en el catálogo
 * `MODULE_BILLBOARD_INFO`. El path es idéntico al original — solo
 * cambia la envoltura (componente con props `{ size, color }`).
 *
 * Nota: el SVG original tiene viewBox 110.382×104.639 (no cuadrado).
 * Mantenemos la proporción ajustando height proporcional al size para
 * preservar el aspecto del diseño aprobado.
 */
export function CameraIcon({ size, color }: { size: number; color: string }) {
  // Mantiene la proporción 110.382:104.639 (≈ 1:0.948) del SVG original.
  const height = Math.round(size * (104.639 / 110.382));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={height}
      viewBox="0 0 110.382 104.639"
      fill="none"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Cámara"
    >
      <path
        d="M3,43.2H8.743c5.352,0,8.028,0,10.139.874A11.488,11.488,0,0,1,25.1,50.3c.874,2.111.874,4.787.874,10.139s0,8.028-.874,10.139a11.488,11.488,0,0,1-6.217,6.217c-2.111.874-4.787.874-10.139.874H3M94.9,20.23V14.487A11.487,11.487,0,0,0,83.408,3H71.921A11.487,11.487,0,0,0,60.435,14.487V20.23M21.379,100.639H88c6.433,0,9.65,0,12.107-1.252a11.485,11.485,0,0,0,5.02-5.02c1.252-2.457,1.252-5.674,1.252-12.107V38.609c0-6.433,0-9.65-1.252-12.107a11.485,11.485,0,0,0-5.02-5.02C97.653,20.23,94.436,20.23,88,20.23H21.379c-6.433,0-9.65,0-12.107,1.252a11.486,11.486,0,0,0-5.02,5.02C3,28.959,3,32.176,3,38.609V82.26c0,6.433,0,9.65,1.252,12.107a11.485,11.485,0,0,0,5.02,5.02C11.729,100.639,14.946,100.639,21.379,100.639Zm62.029-40.2A17.23,17.23,0,1,1,66.178,43.2,17.23,17.23,0,0,1,83.408,60.435Z"
        transform="translate(0.5 0.5)"
      />
    </svg>
  );
}
