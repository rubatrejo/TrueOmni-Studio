'use client';

import { useEffect, useState } from 'react';

import { QrPurchaseModal } from './qr-purchase-modal';
import { SentConfirmation } from './sent-confirmation';

interface Props {
  /** Nombre del CustomEvent a escuchar (ej. 'kiosk:pass-share-open' o 'kiosk:ticket-purchase-open'). */
  eventName: string;
  /** Título que pasará al modal. */
  title: string;
  /** URL del QR y payload del SMS. */
  purchaseUrl: string;
  /** Precio opcional (Tickets). */
  priceDisplay?: string;
  /** Label custom del botón submit (ej. "BUY TICKET"). Si no, usa textos.qr_send. */
  submitLabel?: string;
  /** Si true, el submit es full-width (modo compra Tickets). */
  submitFullWidth?: boolean;
  textos: Record<string, string>;
  qrLogo?: string;
  /** Textos del sent-confirmation. */
  sentTitle: string;
  sentMessage: string;
  /** Callback llamado al completar el envío (telemetría / CustomEvent downstream). */
  onSent?: (phoneDigits: string) => void;
}

type Phase = 'closed' | 'share' | 'sent';

/**
 * Host compartido del modal de compra/share QR. Escucha un CustomEvent
 * parametrizable, abre el `QrPurchaseModal` y muestra `SentConfirmation`
 * al completar el envío. Montado como sibling del detail en la ruta
 * `[slug]/page.tsx` de cada módulo consumidor (Passes, Tickets, Events).
 */
export function QrPurchaseHost({
  eventName,
  title,
  purchaseUrl,
  priceDisplay,
  submitLabel,
  submitFullWidth,
  textos,
  qrLogo,
  sentTitle,
  sentMessage,
  onSent,
}: Props) {
  const [phase, setPhase] = useState<Phase>('closed');

  useEffect(() => {
    const onOpen = () => setPhase('share');
    window.addEventListener(eventName, onOpen);
    return () => window.removeEventListener(eventName, onOpen);
  }, [eventName]);

  const handleSent = (phoneDigits: string) => {
    onSent?.(phoneDigits);
    setPhase('sent');
  };

  return (
    <>
      <QrPurchaseModal
        open={phase === 'share'}
        title={title}
        purchaseUrl={purchaseUrl}
        priceDisplay={priceDisplay}
        submitLabel={submitLabel}
        submitFullWidth={submitFullWidth}
        textos={textos}
        qrLogo={qrLogo}
        onCancel={() => setPhase('closed')}
        onSent={handleSent}
      />
      {phase === 'sent' ? (
        <SentConfirmation
          title={sentTitle}
          message={sentMessage}
          onAutoClose={() => setPhase('closed')}
        />
      ) : null}
    </>
  );
}
