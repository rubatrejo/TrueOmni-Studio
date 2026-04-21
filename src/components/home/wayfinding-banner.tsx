import Link from 'next/link';

interface Props {
  wayfinding: { label: string; image: string };
}

/**
 * Wayfinding banner 950×460 rx=9 verbatim del SVG. Se alinea con el ancho
 * del grid (950), centrado en el canvas con 64px padding-left.
 * Label "WAYFINDING" centrado, fontSize 50 Montserrat-Bold white.
 */
export function WayfindingBanner({ wayfinding }: Props) {
  return (
    <Link
      href="/home/wayfinding"
      className="relative block overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
      style={{
        width: '950px',
        height: '460px',
        borderRadius: '9px',
        marginLeft: '64px',
        marginRight: '66px',
        marginTop: '30px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wayfinding.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
      <span
        className="absolute font-display font-bold uppercase text-white"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '50px',
          letterSpacing: '0.02em',
        }}
      >
        {wayfinding.label.toUpperCase()}
      </span>
    </Link>
  );
}
