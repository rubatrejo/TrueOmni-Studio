'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CheckboxRow, RadioRow } from './form-controls';
import { InLayerNav } from './in-layer-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';
import { LockIcon } from './signup-icons';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

type Step = 'reason' | 'other' | 'confirm' | 'survey';

interface DeleteFlowTexts {
  title: string;
  surveyTitle: string;
  reason: { heading: string; options: string[]; continueCta: string };
  other: { heading: string; placeholder: string; continueCta: string };
  confirm: {
    heading: string;
    sendDataLabel: string;
    passwordPlaceholder: string;
    warning: string;
    continueCta: string;
  };
  survey: { question: string; options: string[]; deleteCta: string };
}

/** Botón de acción inferior (CONTINUE / DELETE MY ACCOUNT). */
function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute flex items-center justify-center rounded-[2px] bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
      style={{ left: 24, top: 650, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
    >
      {label}
    </button>
  );
}

/**
 * Flujo Delete Account (`/pwa/profile/delete`) — pantallas 7-10 en una ruta con estado:
 * reason → [other si "Other"] → confirm (password) → survey → DELETE → logout (`/pwa`).
 * Fondo blanco, header "Delete Profile"/"Survey", bottom nav.
 */
export function DeleteAccountFlow({
  texts,
  logoutHref,
}: {
  texts: DeleteFlowTexts;
  logoutHref: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('reason');
  const [reasonIdx, setReasonIdx] = useState(texts.reason.options.length - 1); // "Other" por defecto (como el XD)
  const [otherText, setOtherText] = useState('');
  const [sendData, setSendData] = useState(true);
  const [password, setPassword] = useState('');
  const [surveyIdx, setSurveyIdx] = useState(texts.survey.options.length - 1);

  const isOther = reasonIdx === texts.reason.options.length - 1;
  const headerTitle = step === 'survey' ? texts.surveyTitle : texts.title;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        <PwaSubHeader title={headerTitle} backHref="/pwa/profile/settings" />

        {step === 'reason' ? (
          <>
            <div
              className="absolute text-foreground"
              style={{
                left: 30,
                top: 104,
                width: 320,
                fontSize: 14,
                lineHeight: '20px',
                ...OPEN_SANS,
              }}
            >
              {texts.reason.heading}
            </div>
            <div className="absolute" style={{ left: 30, top: 170, width: 315 }}>
              {texts.reason.options.map((opt, i) => (
                <RadioRow
                  key={opt}
                  label={opt}
                  selected={reasonIdx === i}
                  onSelect={() => setReasonIdx(i)}
                />
              ))}
            </div>
            <ActionButton
              label={texts.reason.continueCta}
              onClick={() => setStep(isOther ? 'other' : 'confirm')}
            />
          </>
        ) : null}

        {step === 'other' ? (
          <>
            <div
              className="absolute text-foreground"
              style={{
                left: 30,
                top: 104,
                width: 320,
                fontSize: 14,
                lineHeight: '20px',
                ...OPEN_SANS,
              }}
            >
              {texts.other.heading}
            </div>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder={texts.other.placeholder}
              className="absolute resize-none rounded-[6px] border border-foreground/20 bg-transparent p-4 text-foreground outline-none placeholder:text-foreground/40"
              style={{ left: 30, top: 196, width: 315, height: 256, fontSize: 14, ...OPEN_SANS }}
            />
            <ActionButton label={texts.other.continueCta} onClick={() => setStep('confirm')} />
          </>
        ) : null}

        {step === 'confirm' ? (
          <>
            <div
              className="absolute text-foreground"
              style={{
                left: 30,
                top: 104,
                width: 320,
                fontSize: 14,
                lineHeight: '20px',
                ...OPEN_SANS,
              }}
            >
              {texts.confirm.heading}
            </div>
            <div className="absolute" style={{ left: 30, top: 160, width: 315 }}>
              <CheckboxRow
                checked={sendData}
                label={texts.confirm.sendDataLabel}
                onToggle={() => setSendData((v) => !v)}
              />
            </div>
            <div
              className="absolute text-foreground"
              style={{ left: 30, top: 243, width: 320, fontSize: 14, ...OPEN_SANS }}
            >
              Type your password to delete your account
            </div>
            <div
              className="absolute rounded-[4px] border border-foreground/20"
              style={{ left: 30, top: 285, width: 315, height: 46 }}
            >
              <div className="absolute text-foreground/50" style={{ left: 14, top: 14 }}>
                <LockIcon />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={texts.confirm.passwordPlaceholder}
                className="absolute bg-transparent text-foreground outline-none placeholder:text-foreground/40"
                style={{ left: 46, right: 12, top: 0, bottom: 0, fontSize: 14, ...OPEN_SANS }}
              />
            </div>
            <div
              className="absolute italic text-foreground/45"
              style={{
                left: 30,
                top: 340,
                width: 320,
                fontSize: 13,
                lineHeight: '18px',
                ...OPEN_SANS,
              }}
            >
              {texts.confirm.warning}
            </div>
            <ActionButton label={texts.confirm.continueCta} onClick={() => setStep('survey')} />
          </>
        ) : null}

        {step === 'survey' ? (
          <>
            <div
              className="absolute text-foreground"
              style={{ left: 30, top: 110, width: 320, fontSize: 14, ...OPEN_SANS }}
            >
              {texts.survey.question}
            </div>
            <div className="absolute" style={{ left: 30, top: 142, width: 320 }}>
              {texts.survey.options.map((opt, i) => (
                <RadioRow
                  key={opt}
                  label={opt}
                  selected={surveyIdx === i}
                  onSelect={() => setSurveyIdx(i)}
                />
              ))}
            </div>
            <ActionButton label={texts.survey.deleteCta} onClick={() => router.push(logoutHref)} />
          </>
        ) : null}

        <InLayerNav />
      </div>
    </div>
  );
}
