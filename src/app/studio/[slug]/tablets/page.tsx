import { ComingSoon } from '../_components/ComingSoon';

export const metadata = {
  title: 'Tablets · TrueOmni Studio',
};

export default async function TabletsStub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ComingSoon
      slug={slug}
      product="Tablets"
      description="Editor de Tablets para experiencias touch heredando branding del cliente. Disponible en próximas versiones."
    />
  );
}
