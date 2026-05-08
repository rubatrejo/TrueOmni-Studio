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
      description="Editor de Video Walls multi-pantalla heredando branding del cliente. Disponible en próximas versiones."
    />
  );
}
