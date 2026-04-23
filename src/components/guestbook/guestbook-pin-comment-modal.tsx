'use client';

import { useEffect, useState } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

/**
 * Modal que aparece al soltar un pin en el mapa (pantalla 6). Muestra el
 * avatar + nombre + dateLabel + address + textarea + CONFIRM.
 *
 * Si `readonly` es true, se usa para ver pins de otros usuarios (sin
 * editar comentario, sin botón CONFIRM — solo X para cerrar).
 */
export function GuestbookPinCommentModal({
  open,
  pinImage,
  authorName,
  dateLabel,
  address,
  initialComment = '',
  placeholder,
  confirmLabel,
  readonly = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pinImage: string;
  authorName: string;
  dateLabel: string;
  address: string;
  initialComment?: string;
  placeholder: string;
  confirmLabel: string;
  readonly?: boolean;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState(initialComment);
  const [shift, setShift] = useState(false);

  useEffect(() => {
    if (open) {
      setComment(initialComment);
      setShift(false);
    }
  }, [open, initialComment]);

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  const handleKey = (k: KeyboardKey) => {
    if (readonly) return;
    if (k === 'BACKSPACE') {
      setComment((v) => v.slice(0, -1));
      return;
    }
    if (k === 'SHIFT') {
      setShift((s) => !s);
      return;
    }
    if (k === 'SPACE') {
      setComment((v) => v + ' ');
      return;
    }
    if (k === 'ENTER') {
      setComment((v) => v + '\n');
      return;
    }
    if (k === 'AT') {
      setComment((v) => v + '@');
      return;
    }
    if (k === 'DOT_COM') {
      setComment((v) => v + '.com');
      return;
    }
    if (k === 'CLOSE' || k === 'SYMBOLS') return;
    if (typeof k === 'string' && k.length === 1) {
      setComment((v) => (v + k).slice(0, 240));
      if (shift) setShift(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestbook-pin-modal-title"
      className="absolute inset-0 flex items-center justify-center"
      style={{
        zIndex: 60,
      }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        tabIndex={-1}
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      />

      <div
        className="relative flex flex-col items-center"
        style={{
          width: '600px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
          padding: '70px 40px 32px 40px',
        }}
      >
        {/* Avatar flotante arriba — usa la imagen Pin-N-Circle.png que ya
            trae su propio diseño circular con borde. Sin wrapper extra. */}
        <div
          aria-hidden
          className="absolute flex items-center justify-center"
          style={{
            top: '-52px',
            left: 'calc(50% - 52px)',
            width: '104px',
            height: '104px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pinImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
            }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onCancel}
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          style={{
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            color: '#4a4a4a',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="#4a4a4a"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2
          id="guestbook-pin-modal-title"
          className="font-sans"
          style={{
            fontSize: '26px',
            lineHeight: '30px',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '6px',
          }}
        >
          {authorName}
        </h2>
        <p
          className="font-sans"
          style={{
            fontSize: '14px',
            lineHeight: '14px',
            fontWeight: 600,
            color: '#8a8a8a',
            marginBottom: '6px',
            letterSpacing: '0.04em',
          }}
        >
          {dateLabel}
        </p>
        <p
          className="text-center font-sans"
          style={{
            fontSize: '15px',
            lineHeight: '18px',
            color: '#1a1a1a',
            marginBottom: '18px',
          }}
        >
          {address}
        </p>

        {readonly ? (
          <p
            className="font-sans"
            style={{
              fontSize: '15px',
              lineHeight: '22px',
              color: '#3a3a3a',
              width: '100%',
              whiteSpace: 'pre-wrap',
              minHeight: '60px',
            }}
          >
            {comment || '—'}
          </p>
        ) : (
          <>
            <div
              className="font-sans"
              style={{
                width: '100%',
                minHeight: '100px',
                maxHeight: '160px',
                backgroundColor: '#f5f7fa',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '15px',
                lineHeight: '20px',
                color: comment.length > 0 ? '#1a1a1a' : '#9a9a9a',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                marginBottom: '18px',
              }}
              aria-label="Comentario"
            >
              {comment.length > 0 ? comment : placeholder}
            </div>
            <button
              type="button"
              onClick={() => onConfirm(comment.trim())}
              className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              style={{
                alignSelf: 'flex-start',
                padding: '12px 40px',
                borderRadius: '6px',
                backgroundColor: '#1796d6',
                fontSize: '18px',
                lineHeight: '18px',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              {confirmLabel}
            </button>
          </>
        )}
      </div>

      {!readonly ? (
        <div
          className="absolute inset-x-0"
          style={{
            bottom: 0,
            backgroundColor: '#ffffff',
            boxShadow: '0 -8px 20px rgba(0,0,0,0.12)',
          }}
        >
          <OnScreenKeyboard shift={shift} onKey={handleKey} />
        </div>
      ) : null}
    </div>
  );
}
