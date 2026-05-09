import { ComingSoon } from '../_components/ComingSoon';

export const metadata = {
  title: 'Tablets · TrueOmni Studio',
};

export default async function TabletsStub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <ComingSoon
      slug={slug}
      product="Tablets"
      timeline="Exploring · 2027"
      tone="exploring"
      description="Variante portátil del kiosk para staff de piso: concierge en hoteles, anfitriones en restaurantes, runners en eventos. Mismo motor de módulos que el kiosk pero optimizado para 10–13″ landscape y uso prolongado en mano."
      features={[
        'Reusa la mayoría de módulos del kiosk (listings, events, passes, itinerary) sin re-maquetar.',
        'Modo "shift" con autenticación por staff member — locks anti-tampering al pasar el tablet a un colega.',
        'Push-to-kiosk: el staff envía un itinerario o un pase directo al kiosk del lobby.',
        'Hardware ref: iPad 11" + MDM, Lenovo M11, Samsung Tab Active5 para entornos rugged.',
        'Decisión pendiente: PWA + lock task vs app nativa MDM-distributed (estamos investigando).',
      ]}
    />
  );
}
