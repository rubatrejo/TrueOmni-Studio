'use client';

import { useEffect, useState } from 'react';

import { prewarmAiAvatar } from '@/components/ai/ai-modal';
import { AiModalHost } from '@/components/ai/ai-modal-host';
import { AskAiTrigger } from '@/components/ai/ask-ai-trigger';

interface AskAiTextos {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  ariaClose: string;
  ariaMic: string;
}

interface AskAiHostProps {
  /** Si false, el componente no renderiza nada (módulo apagado en config). */
  enabled: boolean;
  ariaLabel: string;
  avatarSrc: string;
  heroVideoSrc: string;
  greeting: string;
  /** Subtítulo ya interpolado con `client_name`. */
  subtitle: string;
  suggestedQuestions: ReadonlyArray<{ id: string; text: string; response: string }>;
  clientName: string;
  textos: AskAiTextos;
  position: { right: number; bottom: number; size: number; width?: number; height?: number };
}

type SystemModulesDetail = { ads: boolean; languages: boolean; aiAvatar: boolean };
type AiAvatarDetail = {
  avatar?: string;
  heroVideo?: string;
  greeting?: string;
  suggestedQuestions?: Array<{ id: string; text: string }>;
};

/**
 * Wrapper client-side de Ask AI que respeta los overrides del Studio:
 *   - `kiosk:system-modules-override` → toggle on/off del bubble entero.
 *   - `kiosk:ai-avatar-override` → cambio en vivo de avatar/greeting/preguntas.
 *
 * En runtime normal (sin Studio iframe) usa los props del config y se
 * comporta como antes.
 */
export function AskAiHost(props: AskAiHostProps) {
  const [hidden, setHidden] = useState(!props.enabled);
  const [override, setOverride] = useState<AiAvatarDetail | null>(null);

  // Pre-warm la conversación Tavus en background al montar /home (si el
  // módulo está habilitado). Resultado: cuando el usuario tap el trigger,
  // el conversation_url ya está creado → avatar visible ~3-4s más rápido.
  useEffect(() => {
    if (!props.enabled) return;
    const t = setTimeout(prewarmAiAvatar, 1500);
    return () => clearTimeout(t);
  }, [props.enabled]);

  useEffect(() => {
    setHidden(!props.enabled);
  }, [props.enabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSys = (e: Event) => {
      const detail = (e as CustomEvent<SystemModulesDetail>).detail;
      if (typeof detail?.aiAvatar === 'boolean') setHidden(!detail.aiAvatar);
    };
    const onAi = (e: Event) => {
      const detail = (e as CustomEvent<AiAvatarDetail>).detail;
      if (detail) setOverride(detail);
    };
    window.addEventListener('kiosk:system-modules-override', onSys);
    window.addEventListener('kiosk:ai-avatar-override', onAi);
    return () => {
      window.removeEventListener('kiosk:system-modules-override', onSys);
      window.removeEventListener('kiosk:ai-avatar-override', onAi);
    };
  }, []);

  if (hidden) return null;

  const avatarSrc = override?.avatar?.length ? override.avatar : props.avatarSrc;
  const heroVideoSrc = override?.heroVideo?.length ? override.heroVideo : props.heroVideoSrc;
  const greeting = override?.greeting?.length
    ? override.greeting.replaceAll('{client_name}', props.clientName)
    : props.greeting;
  const suggested = override?.suggestedQuestions?.length
    ? override.suggestedQuestions.map((q) => ({ id: q.id, text: q.text, response: '' }))
    : ([...props.suggestedQuestions] as Array<{ id: string; text: string; response: string }>);

  return (
    <>
      <AskAiTrigger
        avatarSrc={avatarSrc}
        ariaLabel={props.ariaLabel}
        size={props.position.size}
        width={props.position.width}
        height={props.position.height}
        position={{ right: props.position.right, bottom: props.position.bottom }}
      />
      <AiModalHost
        heroVideoSrc={heroVideoSrc}
        greeting={greeting}
        suggestedQuestions={suggested}
        clientName={props.clientName}
        textos={props.textos}
      />
    </>
  );
}
