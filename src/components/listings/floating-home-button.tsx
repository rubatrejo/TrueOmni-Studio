import Link from 'next/link';

/**
 * Floating Home button — pill azul `hsl(var(--brand-primary))` de 116×232 que sobresale del
 * borde izquierdo del canvas con esquina izquierda plana y corona derecha
 * redondeada. Icono home blanco centrado a la derecha. Sombra drop-right.
 *
 * La forma replica la del asset `button-home.svg` del XD.
 * Click → `/home`.
 */
export function FloatingHomeButton() {
  return (
    <Link
      href="/home"
      aria-label="Volver al Home"
      className="absolute z-30 flex items-center justify-end focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        left: 0,
        top: '1000px',
        width: '116px',
        height: '232px',
        backgroundColor: 'hsl(var(--brand-primary))',
        borderTopRightRadius: '116px',
        borderBottomRightRadius: '116px',
        paddingRight: '28px',
        boxShadow: '12px 0 28px rgba(0,0,0,0.22)',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="54"
        height="44"
        viewBox="0 0 54 44"
        aria-hidden
      >
        <path
          d="M33.6,42.08h0a1.391,1.391,0,0,1-1.078-.469,1.65,1.65,0,0,1-.515-1.03v-9c0-.041,0-.081,0-.122a1.278,1.278,0,0,0-.1-.629c-.088-.175-.5-.318-.825-.433a3.363,3.363,0,0,1-.338-.129A1.673,1.673,0,0,0,30,30.08H24a1.464,1.464,0,0,0-1.078.422c-.072.072-.166.149-.266.23-.3.245-.641.522-.641.848v9a1.4,1.4,0,0,1-.329,1.03,2.593,2.593,0,0,0-.166.208.5.5,0,0,1-.52.261H10.9a1.466,1.466,0,0,1-1.078-.422c-.05-.05-.109-.105-.172-.163-.285-.264-.675-.626-.675-.985v-15.4L26.25,10.955a1.595,1.595,0,0,1,1.5,0L45,25.04V40.509c0,.338-.342.635-.618.874-.083.072-.162.14-.226.2a1.469,1.469,0,0,1-1.078.421Zm16.931-16.5a1.019,1.019,0,0,1-.751-.282L27.75,7.111a1.595,1.595,0,0,0-1.5,0L4.218,25.3a.9.9,0,0,1-.656.282,1.157,1.157,0,0,1-.937-.469L.281,22.2A.9.9,0,0,1,0,21.549a1.278,1.278,0,0,1,.375-.938l23.719-19.5A4.612,4.612,0,0,1,27,.08a4.245,4.245,0,0,1,2.813,1.031l9.161,6.938V1.205c0-.041,0-.081,0-.121a.833.833,0,0,1,.182-.677A1.174,1.174,0,0,1,39.962,0h3.923a1.089,1.089,0,0,1,.8.328,1.089,1.089,0,0,1,.328.8L45,13.977l8.62,6.634a1.278,1.278,0,0,1,.375.938.9.9,0,0,1-.282.656l-2.344,2.906A1.078,1.078,0,0,1,50.531,25.58Z"
          fill="#ffffff"
        />
      </svg>
    </Link>
  );
}
