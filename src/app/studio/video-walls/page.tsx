import { ComingSoon } from '../_components/ComingSoon';
import { STUDIO_PRODUCTS } from '../_lib/products';

export default function VideoWallsPage() {
  const product = STUDIO_PRODUCTS.find((p) => p.id === 'video-walls')!;
  return <ComingSoon product={product} />;
}
