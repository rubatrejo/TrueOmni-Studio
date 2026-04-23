'use client';

import { useCallback, useEffect, useState } from 'react';

import { SendConfirmationPopup } from '@/components/listings/send-confirmation-popup';
import { SendToEmailModal } from '@/components/listings/send-to-email-modal';
import { SendToPhoneModal } from '@/components/listings/send-to-phone-modal';
import type { Deal } from '@/lib/config';

import { DealRedeemModal } from './deal-redeem-modal';

type HostState =
  | { stage: 'closed' }
  | { stage: 'redeem'; deal: Deal }
  | { stage: 'send-phone'; deal: Deal }
  | { stage: 'send-email'; deal: Deal }
  | { stage: 'sent'; deal: Deal; kind: 'phone' | 'email'; destination: string };

/**
 * Host del modal redeem de Deals. Escucha `CustomEvent('kiosk:deal-redeem-open')`
 * con `detail.dealSlug`. Orquesta la transición redeem → send-phone/email
 * → sent confirmation. Re-usa `SendToPhoneModal` / `SendToEmailModal` /
 * `SendConfirmationPopup` de listings.
 */
export function DealRedeemHost({
  deals,
  qrLogo,
  textos,
}: {
  deals: readonly Deal[];
  qrLogo?: string;
  textos: Record<string, string>;
}) {
  const [state, setState] = useState<HostState>({ stage: 'closed' });

  useEffect(() => {
    const handler = (evt: Event) => {
      const ce = evt as CustomEvent<{ dealSlug: string }>;
      const slug = ce.detail?.dealSlug;
      if (!slug) return;
      const deal = deals.find((d) => d.slug === slug);
      if (!deal) return;
      setState({ stage: 'redeem', deal });
    };
    window.addEventListener('kiosk:deal-redeem-open', handler as EventListener);
    return () => window.removeEventListener('kiosk:deal-redeem-open', handler as EventListener);
  }, [deals]);

  const close = useCallback(() => setState({ stage: 'closed' }), []);

  return (
    <>
      <DealRedeemModal
        open={state.stage === 'redeem'}
        deal={state.stage === 'redeem' ? state.deal : null}
        qrLogo={qrLogo}
        textos={textos}
        onCancel={close}
        onSendPhone={() => {
          if (state.stage === 'redeem') setState({ stage: 'send-phone', deal: state.deal });
        }}
        onSendEmail={() => {
          if (state.stage === 'redeem') setState({ stage: 'send-email', deal: state.deal });
        }}
      />

      <SendToPhoneModal
        open={state.stage === 'send-phone'}
        listingTitle={state.stage === 'send-phone' ? state.deal.title : ''}
        onCancel={close}
        onSent={(phone) => {
          if (state.stage === 'send-phone') {
            setState({ stage: 'sent', deal: state.deal, kind: 'phone', destination: phone });
          }
        }}
      />

      <SendToEmailModal
        open={state.stage === 'send-email'}
        listingTitle={state.stage === 'send-email' ? state.deal.title : ''}
        onCancel={close}
        onSent={(email) => {
          if (state.stage === 'send-email') {
            setState({ stage: 'sent', deal: state.deal, kind: 'email', destination: email });
          }
        }}
      />

      <SendConfirmationPopup
        open={state.stage === 'sent'}
        kind={state.stage === 'sent' ? state.kind : 'phone'}
        destination={state.stage === 'sent' ? state.destination : ''}
        onClose={close}
      />
    </>
  );
}
