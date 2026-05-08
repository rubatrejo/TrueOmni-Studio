import { ComingSoon } from '../_components/ComingSoon';

export const metadata = {
  title: 'Video Walls · TrueOmni Studio',
};

export default async function VideoWallsStub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ComingSoon
      slug={slug}
      product="Video Walls"
      timeline="On roadmap · Q4 2026"
      tone="roadmap"
      description="Composición sincronizada para muros de hasta 8 displays. Un compositor único reparte la pieza entre N pantallas — bandas horizontales, cuadrículas 2x2/4x2, supersized hero, recorridos cinemáticos."
      features={[
        'Layouts predefinidos: hero único, banda 1×4, grid 2×2, grid 4×2 con masking automático.',
        'Sync por NTP entre todos los nodos — sin tearing visible al cambiar de pieza.',
        'Reuso del playlist + branding del producto Digital Displays (no se duplica el catálogo).',
        'Dayparting independiente por wall — restaurante de día, bar de noche, etc.',
        'Hardware ref: Brightsign XT5 series, LG webOS 6+, o stack Pi 5 con Pixie Player.',
      ]}
    />
  );
}
