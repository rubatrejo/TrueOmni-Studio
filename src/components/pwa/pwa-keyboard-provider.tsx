'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  PWA_KEYBOARD_HEIGHT,
  PwaIosKeyboard,
  type KbInputType,
  type KeyboardKey,
} from './pwa-ios-keyboard';

/** Canvas de referencia de la PWA (debe coincidir con MobileCanvas). */
const CANVAS_HEIGHT = 844;
const CANVAS_WIDTH = 390;
/** Margen entre el campo enfocado y el borde superior del teclado al subir. */
const LIFT_MARGIN = 14;

type Editable = HTMLInputElement | HTMLTextAreaElement;

const EDITABLE_INPUT_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
]);

function isEditable(el: EventTarget | null): el is Editable {
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) {
    return !el.readOnly && !el.disabled && EDITABLE_INPUT_TYPES.has(el.type);
  }
  return false;
}

/** Algunos tipos (email/number) no soportan selectionStart/setSelectionRange. */
function supportsSelection(el: Editable): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  return !['email', 'number'].includes(el.type);
}

function inputTypeOf(el: Editable): KbInputType {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'email') return 'email';
    if (el.type === 'number' || el.type === 'tel') return 'numeric';
    if (el.inputMode === 'numeric' || el.inputMode === 'tel') return 'numeric';
  }
  return 'text';
}

/** Escribe en un input controlado de React vía el setter nativo + evento input. */
function setNativeValue(el: Editable, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Provider del teclado iOS de la PWA. Envuelve el contenido del canvas y:
 *  - detecta foco en cualquier input/textarea editable (sin tocar su código),
 *  - escribe vía native value setter para que React recoja el cambio,
 *  - sube el contenido para que el campo enfocado quede visible,
 *  - bloquea el teclado del SO en móvil real (`inputMode='none'`).
 */
export function PwaKeyboardProvider({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Editable | null>(null);
  const prevInputModeRef = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(0);
  const [inputType, setInputType] = useState<KbInputType>('text');
  const [enterLabel, setEnterLabel] = useState('return');

  /** Escala efectiva del canvas (dev-view escala; embedded = 1). */
  const canvasScale = useCallback((): number => {
    const canvas = wrapperRef.current?.closest('[data-pwa-canvas]') as HTMLElement | null;
    if (!canvas) return 1;
    const w = canvas.getBoundingClientRect().width;
    return w > 0 ? w / CANVAS_WIDTH : 1;
  }, []);

  const computeLift = useCallback(() => {
    const el = activeRef.current;
    const canvas = wrapperRef.current?.closest('[data-pwa-canvas]') as HTMLElement | null;
    if (!el || !canvas) return;
    const scale = canvasScale();
    // Por defecto se eleva el propio campo a `LIFT_MARGIN` del teclado. Un contenedor
    // (p. ej. un popup con footer debajo del campo, como el survey) puede pedir
    // `data-kb-lift` para que se mida SU borde inferior, y `data-kb-margin` para el
    // gap deseado contra el teclado. Sin esos atributos, el comportamiento es el de antes.
    const liftEl = (el.closest('[data-kb-lift]') as HTMLElement | null) ?? el;
    const refRect = liftEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    // Borde inferior de referencia en el espacio interno del canvas (390×844).
    const refBottom = (refRect.bottom - canvasRect.top) / scale;
    const marginAttr = liftEl.dataset.kbMargin ?? el.dataset.kbMargin;
    const margin = marginAttr != null ? Number(marginAttr) : LIFT_MARGIN;
    const kbTop = CANVAS_HEIGHT - PWA_KEYBOARD_HEIGHT;
    setLift(Math.max(0, refBottom - (kbTop - margin)));
  }, [canvasScale]);

  const restoreInputMode = useCallback(() => {
    const el = activeRef.current;
    if (el && prevInputModeRef.current !== null) {
      el.inputMode = prevInputModeRef.current;
      prevInputModeRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    restoreInputMode();
    activeRef.current = null;
    setVisible(false);
    setLift(0);
  }, [restoreInputMode]);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    const focusOn = (el: Editable) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      // Restaurar el inputMode del campo anterior antes de cambiar de activo.
      if (activeRef.current && activeRef.current !== el) restoreInputMode();
      activeRef.current = el;
      setInputType(inputTypeOf(el));
      setEnterLabel(el.getAttribute('enterkeyhint') === 'search' ? 'Search' : 'return');
      // Suprimir teclado nativo del SO en móvil real (no-op en desktop).
      prevInputModeRef.current = el.inputMode || '';
      el.inputMode = 'none';
      setVisible(true);
      requestAnimationFrame(computeLift);
    };

    const onFocusIn = (e: FocusEvent) => {
      if (isEditable(e.target)) focusOn(e.target);
    };

    const onFocusOut = (e: FocusEvent) => {
      if (e.target !== activeRef.current) return;
      // Diferir: si el foco salta a otro input (o vuelve al teclado), no ocultar.
      hideTimer.current = setTimeout(hide, 60);
    };

    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    // El campo ya enfocado al montar (p. ej. autoFocus de Search) dispara su
    // focusin antes de que este listener exista; lo recuperamos aquí.
    const active = document.activeElement;
    if (isEditable(active) && root.contains(active)) focusOn(active);

    return () => {
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [computeLift, hide, restoreInputMode]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => computeLift();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, computeLift]);

  const handleKey = useCallback(
    (k: KeyboardKey) => {
      const el = activeRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });

      if (k === 'ENTER') {
        if (el instanceof HTMLTextAreaElement) {
          insertText(el, '\n');
          requestAnimationFrame(computeLift);
        } else {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          el.blur();
        }
        return;
      }

      if (k === 'BACKSPACE') {
        deleteBeforeCaret(el);
        return;
      }

      insertText(el, k === 'SPACE' ? ' ' : k);
    },
    [computeLift],
  );

  return (
    <>
      <div
        ref={wrapperRef}
        className="h-full w-full"
        style={{
          transform: `translateY(${-lift}px)`,
          transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {children}
      </div>
      <PwaIosKeyboard
        visible={visible}
        inputType={inputType}
        enterLabel={enterLabel}
        onKey={handleKey}
      />
    </>
  );
}

/* ---------------- helpers de edición sobre el caret ---------------- */

function insertText(el: Editable, text: string) {
  if (supportsSelection(el)) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + text + el.value.slice(end);
    setNativeValue(el, next);
    const caret = start + text.length;
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      /* algunos tipos no lo permiten */
    }
  } else {
    setNativeValue(el, el.value + text);
  }
}

function deleteBeforeCaret(el: Editable) {
  if (supportsSelection(el)) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start === end) {
      if (start === 0) return;
      const next = el.value.slice(0, start - 1) + el.value.slice(end);
      setNativeValue(el, next);
      const caret = start - 1;
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* noop */
      }
    } else {
      const next = el.value.slice(0, start) + el.value.slice(end);
      setNativeValue(el, next);
      try {
        el.setSelectionRange(start, start);
      } catch {
        /* noop */
      }
    }
  } else {
    setNativeValue(el, el.value.slice(0, -1));
  }
}
