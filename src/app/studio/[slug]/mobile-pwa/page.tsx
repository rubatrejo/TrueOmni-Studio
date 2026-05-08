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
      description="Editor del Progressive Web App heredando branding del cliente. Disponible en próximas versiones."
    />
  );
}
