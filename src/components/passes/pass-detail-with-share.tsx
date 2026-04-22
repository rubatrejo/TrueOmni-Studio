'use client';

import type { PassItem } from '@/lib/config';

import { PassDetail } from './pass-detail';

interface Props {
  moduleKey: string;
  pass: PassItem;
  textos: Record<string, string>;
}

/**
 * Wrapper client del PassDetail con share cableado al PassShareHost via
 * CustomEvent — así no se pasan funciones Server→Client.
 */
export function PassDetailWithShare({ moduleKey, pass, textos }: Props) {
  const handleShareOpen = () => {
    window.dispatchEvent(new CustomEvent('kiosk:pass-share-open'));
  };
  return (
    <PassDetail moduleKey={moduleKey} pass={pass} textos={textos} onShareOpen={handleShareOpen} />
  );
}
