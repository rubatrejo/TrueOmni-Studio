'use client';

import { useEffect, useRef, useState } from 'react';

import type { GuestbookPinOption } from '@/lib/config';

/**
 * Barra inferior horizontal con los 5 pins del catálogo del cliente.
 * Cada pin es draggable: al hacer pointer down, aparece un clone fixed
 * que sigue el pointer hasta el `pointerup`.
 *
 * Avisa al padre con `onDrop(optionId, clientX, clientY)`. El padre decide
 * si la coord cae dentro del mapa y ejecuta `map.unproject`.
 *
 * Si la opción `usedIds` la incluye, el pin se muestra atenuado (ya usado
 * en la sesión — en el mockup pantalla 5 el pin avatar-woman aparece
 * "gastado" tras usarse).
 */
export function GuestbookPinRail({
  title,
  subtitle,
  options,
  usedIds,
  onDrop,
}: {
  title: string;
  subtitle: string;
  options: readonly GuestbookPinOption[];
  usedIds: readonly string[];
  onDrop: (optionId: string, clientX: number, clientY: number) => void;
}) {
  return (
    <div
      className="flex w-full flex-col items-center"
      style={{
        backgroundColor: '#ffffff',
        paddingTop: '20px',
        paddingBottom: '28px',
        boxShadow: '0 -8px 20px rgba(0,0,0,0.08)',
      }}
    >
      <h3
        className="font-sans"
        style={{
          fontSize: '22px',
          lineHeight: '22px',
          fontWeight: 700,
          color: '#004f8b',
          letterSpacing: '-0.01em',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p
        className="font-sans"
        style={{
          fontSize: '15px',
          lineHeight: '18px',
          color: '#6e6e6e',
          marginBottom: '18px',
        }}
      >
        {subtitle}
      </p>
      <div className="flex items-end justify-center" style={{ columnGap: '24px' }}>
        {options.map((o) => (
          <PinRailItem key={o.id} option={o} used={usedIds.includes(o.id)} onDrop={onDrop} />
        ))}
      </div>
    </div>
  );
}

function PinRailItem({
  option,
  used,
  onDrop,
}: {
  option: GuestbookPinOption;
  used: boolean;
  onDrop: (optionId: string, clientX: number, clientY: number) => void;
}) {
  const [dragging, setDragging] = useState<null | { x: number; y: number }>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Auto-cleanup si el componente se desmonta durante el drag
  useEffect(() => {
    return () => {
      pointerIdRef.current = null;
    };
  }, []);

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (used) return;
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
    pointerIdRef.current = e.pointerId;
    setDragging({ x: e.clientX, y: e.clientY });
  };

  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    setDragging({ x: e.clientX, y: e.clientY });
  };

  const end = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    const { clientX, clientY } = e;
    setDragging(null);
    onDrop(option.id, clientX, clientY);
  };

  return (
    <>
      <button
        type="button"
        onPointerDown={startDrag}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => {
          pointerIdRef.current = null;
          setDragging(null);
        }}
        disabled={used}
        aria-label={option.label}
        className="focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{
          width: '72px',
          height: '90px',
          opacity: used ? 0.25 : 1,
          cursor: used ? 'not-allowed' : 'grab',
          touchAction: 'none',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={option.image}
          alt={option.label}
          draggable={false}
          style={{
            width: '72px',
            height: '90px',
            pointerEvents: 'none',
            filter: used ? 'grayscale(0.8)' : 'none',
            display: 'block',
          }}
        />
      </button>
      {dragging ? (
        <div
          aria-hidden
          className="pointer-events-none fixed"
          style={{
            left: `${dragging.x - 48}px`,
            top: `${dragging.y - 120}px`,
            width: '96px',
            height: '120px',
            zIndex: 70,
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.image}
            alt=""
            draggable={false}
            style={{ width: '96px', height: '120px', display: 'block' }}
          />
        </div>
      ) : null}
    </>
  );
}
