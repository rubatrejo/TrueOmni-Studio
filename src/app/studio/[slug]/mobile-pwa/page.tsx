import { ComingSoon } from '../_components/ComingSoon';

export const metadata = {
  title: 'Mobile PWA · TrueOmni Studio',
};

export default async function MobilePwaStub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ComingSoon
      slug={slug}
      product="Mobile PWA"
      timeline="In design · Q3 2026"
      tone="design"
      description="Companion app del kiosk: el visitante escanea el QR del kiosk y se lleva el itinerario, los favoritos y los pases en su teléfono. Hereda branding, fonts y módulos del cliente sin reconfiguración."
      features={[
        'Login passwordless por código del kiosk — el itinerario salta del kiosk al teléfono en un escaneo.',
        'Favoritos sincronizados (listings, events, deals) entre kiosk y phone.',
        'Pases y tickets como wallet card (Apple Wallet / Google Wallet).',
        'Modo offline para mapas y rutas guardadas — útil en zonas con cobertura intermitente.',
        'Push notifications opt-in para deals nuevos cerca del visitante.',
      ]}
    />
  );
}
