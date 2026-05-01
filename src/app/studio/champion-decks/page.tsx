import { ComingSoon } from '../_components/ComingSoon';
import { STUDIO_PRODUCTS } from '../_lib/products';

export default function ChampionDecksPage() {
  const product = STUDIO_PRODUCTS.find((p) => p.id === 'champion-decks')!;
  return <ComingSoon product={product} />;
}
