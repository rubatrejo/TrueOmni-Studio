import { ComingSoon } from '../_components/ComingSoon';
import { STUDIO_PRODUCTS } from '../_lib/products';

export default function DigitalDisplaysPage() {
  const product = STUDIO_PRODUCTS.find((p) => p.id === 'digital-displays')!;
  return <ComingSoon product={product} />;
}
