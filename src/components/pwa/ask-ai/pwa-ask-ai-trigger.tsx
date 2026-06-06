'use client';

import { prewarmAiAvatar } from '@/hooks/use-tavus-conversation';
import { resolveAssetUrl } from '@/lib/asset-url';
import { useAiStore } from '@/stores/ai-store';

/** Glifo "sparkles" (fallback si el cliente no configuró avatar). */
function SparklesIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6L12 2z" />
      <path d="M19 14l.9 2.4L22 17l-2.1.8L19 20l-.9-2.2L16 17l2.1-.6L19 14z" />
      <path d="M5 13l.8 2.1L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.9L5 13z" />
    </svg>
  );
}

/**
 * FAB flotante que abre el Ask AI mobile. Usa el MISMO avatar configurado para
 * el kiosk (`features.home.askAi.avatar`) para consistencia entre productos,
 * a tamaño PWA (56×56). Si el cliente no tiene avatar, cae al glifo sparkles.
 * Va sobre el contenido pero DEBAJO de los ads y por encima del bottom nav.
 */
export function PwaAskAiTrigger({
  ariaLabel,
  clientName,
  avatarSrc,
}: {
  ariaLabel: string;
  clientName?: string;
  avatarSrc?: string;
}) {
  const open = useAiStore((s) => s.open);
  // Pre-warm la conversación Tavus al tocar el FAB (antes del open) para que el
  // conversation_url esté casi listo cuando el modal monta.
  const prewarm = () => prewarmAiAvatar(clientName);
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={prewarm}
      onTouchStart={prewarm}
      onClick={open}
      className="absolute z-30 flex items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition-transform active:scale-[0.94]"
      style={{
        right: 16,
        bottom: 72,
        width: 56,
        height: 56,
        backgroundColor: avatarSrc ? undefined : 'hsl(var(--brand-secondary))',
      }}
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveAssetUrl(avatarSrc)}
          alt={ariaLabel}
          className="block h-full w-full object-cover"
        />
      ) : (
        <SparklesIcon size={26} />
      )}
    </button>
  );
}
