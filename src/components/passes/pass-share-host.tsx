'use client';

import { useEffect, useState } from 'react';

import type { PassItem } from '@/lib/config';
import { buildShareResult, dispatchShareResult } from '@/lib/passes';

import { PassSentConfirmation } from './pass-sent-confirmation';
import { PassShareModal } from './pass-share-modal';

interface Props {
  client: { slug: string };
  pass: PassItem;
  textos: Record<string, string>;
  /** Logo centrado en el QR. Opcional — si falta, el QR no lleva imagen. */
  qrLogo?: string;
}

type Phase = 'closed' | 'share' | 'sent';

export function PassShareHost({ client, pass, textos, qrLogo }: Props) {
  const [phase, setPhase] = useState<Phase>('closed');

  useEffect(() => {
    const onOpen = () => setPhase('share');
    window.addEventListener('kiosk:pass-share-open', onOpen);
    return () => window.removeEventListener('kiosk:pass-share-open', onOpen);
  }, []);

  const handleSent = (phoneDigits: string) => {
    const result = buildShareResult({
      client: client.slug,
      passSlug: pass.slug,
      passTitle: pass.title,
      phone: phoneDigits,
      bandwangoUrl: pass.bandwangoUrl,
    });
    dispatchShareResult(result);
    setPhase('sent');
  };

  return (
    <>
      <PassShareModal
        open={phase === 'share'}
        pass={pass}
        textos={textos}
        qrLogo={qrLogo}
        onCancel={() => setPhase('closed')}
        onSent={handleSent}
      />
      {phase === 'sent' ? (
        <PassSentConfirmation
          title={textos.passes_sent_title ?? 'You are all set!'}
          message={textos.passes_sent_message ?? 'The pass was successfully sent'}
          onAutoClose={() => setPhase('closed')}
        />
      ) : null}
    </>
  );
}
