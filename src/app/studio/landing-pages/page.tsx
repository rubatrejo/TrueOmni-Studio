import { ComingSoon } from '../_components/ComingSoon';
import { STUDIO_PRODUCTS } from '../_lib/products';

export default function LandingPagesPage() {
  const product = STUDIO_PRODUCTS.find((p) => p.id === 'landing-pages')!;
  return <ComingSoon product={product} />;
}
