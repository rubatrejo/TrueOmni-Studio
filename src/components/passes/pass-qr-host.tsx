'use client';

import { useTextosMap } from '@/components/i18n-provider';
import { QrPurchaseHost } from '@/components/shared/qr-purchase-host';
import type { PassItem } from '@/lib/config';
import { buildShareResult, dispatchShareResult } from '@/lib/passes';

interface Props {
  clientSlug: string;
  pass: PassItem;
  qrLogo?: string;
}

/**
 * Wrapper client del `QrPurchaseHost` compartido, específico para el módulo Passes.
 * Mapea las keys `passes_share_*` del config a las keys genéricas `qr_*` y
 * ejecuta la telemetría downstream (`dispatchShareResult`) al completar SMS.
 *
 * Vive aquí (no en shared/) porque importa lógica de `@/lib/passes`.
 */
export function PassQrHost({ clientSlug, pass, qrLogo }: Props) {
  const textos = useTextosMap();
  return (
    <QrPurchaseHost
      eventName="kiosk:pass-share-open"
      title={pass.title.toUpperCase()}
      purchaseUrl={pass.bandwangoUrl}
      qrLogo={qrLogo}
      textos={{
        qr_instruction: textos.passes_share_instruction ?? 'SCAN THIS QR CODE TO HAVE YOUR PASS',
        qr_phone_label: textos.passes_share_phone_label ?? 'Enter your phone number',
        qr_country: textos.passes_share_country ?? 'USA (+1)',
        qr_phone_placeholder: textos.passes_share_phone_placeholder ?? '000-555-0115',
        qr_phone_aria: textos.passes_share_phone_aria ?? 'Phone number. Tap to edit via keypad.',
        qr_terms: textos.passes_share_terms ?? 'I accept details',
        qr_send: textos.passes_share_send ?? 'SEND',
      }}
      sentTitle={textos.passes_sent_title ?? 'You are all set!'}
      sentMessage={textos.passes_sent_message ?? 'The pass was successfully sent'}
      onSent={(phoneDigits) => {
        const result = buildShareResult({
          client: clientSlug,
          passSlug: pass.slug,
          passTitle: pass.title,
          phone: phoneDigits,
          bandwangoUrl: pass.bandwangoUrl,
        });
        dispatchShareResult(result);
      }}
    />
  );
}
