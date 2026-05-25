import { resolveBrandVideoSource, type BrandVideoConfig } from '@/lib/studio/brand-video';

/**
 * Overlay `<foreignObject>` que reproduce el `branding.brandVideo` del cliente
 * en la zona de video de un template de Digital Display cuando el slot de
 * video está VACÍO (sin asset asignado).
 *
 * Los templates de signage son un único `<svg>` y la zona de video se pinta
 * con un `<pattern>`/`<image>` estático (no reproduce video). Este overlay se
 * monta DENTRO del mismo `<g>` que el `<rect>` de la zona, justo después del
 * rect, por lo que cubre la imagen estática (pool.png) con el video de marca.
 * El play-icon decorativo, que va después, queda por encima (igual que en el
 * template fullscreen `03` cuando reproduce un asset de video).
 *
 * Coords en el sistema local del `<g>` contenedor (normalmente `x=0,y=0` con
 * el `width`/`height` del rect de la zona). Retorna `null` si el cliente no
 * tiene brand video → cero efecto para clientes sin brandVideo.
 */
export function SignageBrandVideoOverlay({
  brandVideo,
  x = 0,
  y = 0,
  width,
  height,
  audioEnabled = false,
}: {
  brandVideo: BrandVideoConfig | undefined;
  x?: number;
  y?: number;
  width: number;
  height: number;
  audioEnabled?: boolean;
}) {
  const resolved = resolveBrandVideoSource(brandVideo);
  if (!resolved) return null;

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      {resolved.kind === 'youtube' ? (
        <iframe
          src={resolved.embedUrl}
          title="Brand video"
          allow="autoplay; encrypted-media"
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={resolved.src}
          autoPlay
          muted={!audioEnabled}
          loop
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </foreignObject>
  );
}
