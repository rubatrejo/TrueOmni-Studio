import { ComingSoon } from '../_components/ComingSoon';
import { STUDIO_PRODUCTS } from '../_lib/products';

export default function HardwareWrapsPage() {
  const product = STUDIO_PRODUCTS.find((p) => p.id === 'hardware-wraps')!;
  return <ComingSoon product={product} />;
}
