'use client';

import type { ReactNode } from 'react';

import { DraggableKeyboard } from '@/components/keyboard/draggable-keyboard';

import { useEscapeToClose } from './use-escape-to-close';

/**
 * Chrome compartido por los modales SendToEmail y SendToPhone.
 *   - Overlay `rgba(85,85,85,0.8)` inset-0.
 *   - Card blanca 640×480 centrada horizontalmente, top=460.
 *   - Slot `children` para el contenido (label + input + terms + buttons).
 *   - Slot `footer` para el teclado/numpad — envuelto en `DraggableKeyboard`.
 */
export function SendModalChrome({
  open,
  onCancel,
  title,
  children,
  footer,
  keyboardWidth,
  keyboardHeight,
  keyboardStorageKey,
}: {
  open: boolean;
  onCancel: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  /** Default 1080 (QWERTY). NumericKeypad pasa 337. */
  keyboardWidth?: number;
  /** Default 398 (QWERTY). NumericKeypad pasa 345. */
  keyboardHeight?: number;
  /** Clave sessionStorage para persistir la posición del keyboard. */
  keyboardStorageKey?: string;
}) {
  useEscapeToClose(open, onCancel);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="absolute inset-0"
      style={{ zIndex: 40 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(85,85,85,0.8)' }}
        tabIndex={-1}
      />
      {/* Card — altura automática al contenido para no dejar espacio vacío */}
      <div
        className="absolute overflow-hidden bg-white"
        style={{
          left: '220px',
          top: '460px',
          width: '640px',
          borderRadius: '10px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          padding: '36px 40px 36px 40px',
        }}
      >
        <h2
          className="text-center font-sans text-black"
          style={{ fontSize: '28px', lineHeight: '28px', fontWeight: 700, marginBottom: '24px' }}
        >
          {title}
        </h2>
        {children}
      </div>

      {/* Footer (keyboard/numpad) — draggable */}
      <DraggableKeyboard
        width={keyboardWidth}
        height={keyboardHeight}
        storageKey={keyboardStorageKey}
      >
        {footer}
      </DraggableKeyboard>
    </div>
  );
}

export function TermsCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label
      className="flex cursor-pointer items-center justify-center font-sans"
      style={{ fontSize: '16px', lineHeight: '16px', color: '#9a9a9a' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className="mr-2 flex items-center justify-center"
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '3px',
          backgroundColor: checked ? 'hsl(var(--brand-tertiary))' : 'transparent',
          border: checked ? '1px solid hsl(var(--brand-tertiary))' : '1px solid #9a9a9a',
        }}
      >
        {checked ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path
              d="M1 5l3 3L9 2"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span style={{ borderBottom: '1px solid #9a9a9a' }}>{label}</span>
    </label>
  );
}

export function CancelSendButtons({
  onCancel,
  onSend,
  disabled,
}: {
  onCancel: () => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ columnGap: '24px', marginTop: '22px' }}
    >
      <button
        type="button"
        onClick={onCancel}
        className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{
          width: '240px',
          height: '60px',
          borderRadius: '8px',
          backgroundColor: 'hsl(var(--brand-tertiary))',
          fontSize: '22px',
          lineHeight: '22px',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}
      >
        CANCEL
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={disabled}
        className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{
          width: '240px',
          height: '60px',
          borderRadius: '8px',
          backgroundColor: disabled ? 'rgba(23,150,214,0.5)' : '#1796d6',
          fontSize: '22px',
          lineHeight: '22px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        SEND
      </button>
    </div>
  );
}
