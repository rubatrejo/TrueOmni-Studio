'use client';

import { useEffect, useState } from 'react';

import { prewarmAiAvatar } from '@/components/ai/ai-modal';
import { AiModalHost } from '@/components/ai/ai-modal-host';
import { AskAiTrigger } from '@/components/ai/ask-ai-trigger';
import { KIOSK_CLIENT_NAME_OVERRIDE_EVENT, getCachedClientName } from '@/components/studio-bridge';
import { resolveSystemModuleHidden } from '@/components/system-modules-cache';

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
  // Estado inicial: el override del Studio (cache) gana sobre props.enabled, así
  // el bubble respeta el toggle aunque monte después del evento de override.
  const [hidden, setHidden] = useState(() => resolveSystemModuleHidden('aiAvatar', props.enabled));
  const [override, setOverride] = useState<AiAvatarDetail | null>(null);
  // Reactive client name del bridge del Studio. Sustituye `{client_name}`
  // en greeting cuando el operador edita el nombre del kiosk en preview.
  const [reactiveClientName, setReactiveClientName] = useState<string | null>(() =>
    getCachedClientName(),
  );
  useEffect(() => {
    const onName = (event: Event) => {
      const detail = (event as CustomEvent<{ clientName?: string }>).detail;
      if (detail?.clientName) setReactiveClientName(detail.clientName);
    };
    window.addEventListener(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, onName);
    return () => window.removeEventListener(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, onName);
  }, []);
  const effectiveClientName = reactiveClientName ?? props.clientName;

  // Pre-warm la conversación Tavus en background al montar /home (si el
  // módulo está habilitado). Resultado: cuando el usuario tap el trigger,
  // el conversation_url ya está creado → avatar visible ~3-4s más rápido.
  // Pasamos el effectiveClientName al prewarm para que el greeting use el
  // nombre actualizado del kiosk (Studio override). Si cambia el name,
  // prewarmAiAvatar invalida la cache stale y re-warma con el nuevo.
  useEffect(() => {
    if (!props.enabled) return;
    const t = setTimeout(() => prewarmAiAvatar(effectiveClientName), 1500);
    return () => clearTimeout(t);
  }, [props.enabled, effectiveClientName]);

  // Re-sync ante cambios de props.enabled SIN pisar el override del preview:
  // el cache del Studio (si existe) sigue mandando. Antes este efecto hacía
  // `setHidden(!props.enabled)` y, como props.enabled es siempre `true` cuando
  // el host se monta, reaparecía el FAB al montar aunque el operador lo tuviera
  // apagado en el Studio (regresión).
  useEffect(() => {
    setHidden(resolveSystemModuleHidden('aiAvatar', props.enabled));
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
  // Cuando el operador edita greeting en el Studio, override.greeting
  // viene RAW con `{client_name}`. Interpolamos con effectiveClientName
  // (reactivo). Si NO hay override, el greeting del prop también puede
  // venir RAW (desde (kiosk)/home/page.tsx que dejó de pre-interpolar).
  const greeting = (override?.greeting?.length ? override.greeting : props.greeting).replaceAll(
    '{client_name}',
    effectiveClientName,
  );
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
        clientName={effectiveClientName}
      />
      <AiModalHost
        heroVideoSrc={heroVideoSrc}
        greeting={greeting}
        suggestedQuestions={suggested}
        clientName={effectiveClientName}
        textos={props.textos}
      />
    </>
  );
}
