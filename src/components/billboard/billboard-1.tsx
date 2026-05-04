'use client';

import Link from 'next/link';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

import { AccessibilityIcon } from './billboard-footer-parts';
import { CameraIcon } from './icons/camera-icon';
import { RouteIcon } from './icons/route-icon';
import {
  resolveSlotHref,
  resolveSlotIcon,
  resolveSlotImage,
  resolveSlotLabel,
} from './module-info';
import { SlotImage } from './slot-image';
import { useBillboardOverride } from './use-billboard-override';

/**
 * Billboard 1 — variante "Grid + Clock + Weather".
 *
 * Layout replicado del SVG `designs/TNT/Billboard/Billboard 1.svg`:
 * - Header 1020×310 @ (30, 30) con landscape photo + overlay gradient,
 *   reloj y fecha (izquierda), temperatura + condición + icono weather
 *   (derecha).
 * - Grid izquierdo (x=30, width=495):
 *   · THINGS TO DO 495×410 @ y=374 con foto cityscape.
 *   · EVENTS 495×410 @ y=810 con foto fireworks.
 *   · ITINERARY BUILDER 495×208 @ y=1250 olive hsl(var(--brand-tertiary)) con icono ruta.
 *   · PHOTO BOOTH 495×208 @ y=1488 azul hsl(var(--brand-secondary)).
 * - Card derecha grande 495×1326 @ (555, 370) con valentino street +
 *   "TOUCH TO START" 70px Montserrat-Bold + icono click (paths SVG).
 * - Footer 1080×194 @ y=1726 plano hsl(var(--brand-primary)) con logo TrueOmni.
 *
 * Todos los textos y posiciones son verbatim del SVG (Protocolo
 * pixel-perfect paso 2). Icono click-2384 copiado 1:1 sin lucide.
 */
export function Billboard1() {
  const t = useTextosMap();
  const { modules } = useBillboardOverride();
  // Slot labels: si el usuario asignó un módulo distinto al hardcoded del SVG,
  // sustituimos solo el texto. Imagen/icono/color del slot quedan tal cual
  // (decoración heredada del SVG — cambiar imagen e icono por slot es v2.1).
  const slot0 = resolveSlotLabel(modules?.[0], { label: 'Things to do' });
  const slot1 = resolveSlotLabel(modules?.[1], { label: 'Events' });
  const slot2 = resolveSlotLabel(modules?.[2], { label: 'Trip', labelLine2: 'Planner' });
  const slot3 = resolveSlotLabel(modules?.[3], { label: 'Photo', labelLine2: 'Booth' });
  // v2.1: solo el icono reacciona al módulo asignado. Color del slot fijo
  // (olive hsl(var(--brand-tertiary)) / azul hsl(var(--brand-secondary))) — decisión de Rubén 2026-05-01: la
  // identidad cromática de cada slot pertenece al SVG original, no al módulo.
  const Slot2Icon = resolveSlotIcon(modules?.[2], RouteIcon);
  const Slot3Icon = resolveSlotIcon(modules?.[3], CameraIcon);
  return (
    <div
      data-billboard="1"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#fff' }}
    >
      {/* Header 1020×310 @ (30,30): landscape photo + gradient overlay 0.74
          (linear #015cb7 → #f2f2f2 horizontal) + clock/weather widget.
          Texto posicionado con coords verbatim del SVG. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '30px',
          top: '30px',
          width: '1020px',
          height: '310px',
          borderRadius: '9px',
        }}
      >
        <img
          src="/assets/billboard-1/header-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay gradient horizontal verbatim: stops #015cb7 → #f2f2f2, opacity 0.74 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #015cb7 0%, #f2f2f2 100%)',
            opacity: 0.74,
          }}
        />

        {/* 10:37 a.m. baseline (80,191) abs → header-relative (50,161). fontSize 80 */}
        <span
          className="absolute font-display font-bold text-white"
          style={{ left: '50px', top: '95px', fontSize: '80px', lineHeight: '1' }}
        >
          10:37 a.m.
        </span>
        {/* Friday, December 10, 2025 baseline (80,250) abs → (50,220). fontSize 30 */}
        <span
          className="absolute font-display font-bold text-white"
          style={{ left: '50px', top: '195px', fontSize: '30px', lineHeight: '1' }}
        >
          Friday, December 10, 2025
        </span>

        {/* Weather widget: icono + 50° + Cloudy, alineado a la derecha */}
        <div className="absolute flex items-center gap-5" style={{ right: '50px', top: '60px' }}>
          <img
            src="/assets/billboard-1/weather-icon.png"
            alt=""
            style={{ width: '140px', height: 'auto' }}
          />
          <div className="flex flex-col items-start">
            <span
              className="font-display font-bold text-white"
              style={{ fontSize: '90px', lineHeight: '1' }}
            >
              50°
            </span>
            <span
              className="font-display font-bold text-white"
              style={{ fontSize: '32px', lineHeight: '1', marginTop: '18px' }}
            >
              Cloudy
            </span>
          </div>
        </div>
      </div>

      {/* Slot 0 — original SVG: THINGS TO DO (495×410 @ 30, 374) */}
      <Link
        href={resolveSlotHref(modules?.[0])}
        className="absolute block overflow-hidden"
        style={{ left: '30px', top: '374px', width: '495px', height: '410px', borderRadius: '9px' }}
        aria-label={`${slot0.label} ${slot0.labelLine2 ?? ''}`.trim()}
      >
        <SlotImage
          src={resolveSlotImage(modules?.[0], '/assets/billboard-1/things-to-do.png')}
          fallbackSrc="/assets/billboard-1/things-to-do.png"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
        <span
          className="absolute font-display font-bold uppercase leading-[1.05] text-white"
          // Anclado abajo (como slot 1) para que crezca hacia arriba si el
          // módulo asignado tiene labelLine2 (2 líneas) sin desbordar la card.
          // SVG original tenía top:336 con 1 línea — equivalente a bottom:24.
          style={{ left: '70px', bottom: '24px', fontSize: '50px', letterSpacing: '0.02em' }}
        >
          {slot0.label}
          {slot0.labelLine2 ? (
            <>
              <br />
              {slot0.labelLine2}
            </>
          ) : null}
        </span>
      </Link>

      {/* Slot 1 — original SVG: EVENTS (495×410 @ 30, 810) */}
      <Link
        href={resolveSlotHref(modules?.[1])}
        className="absolute block overflow-hidden"
        style={{ left: '30px', top: '810px', width: '495px', height: '410px', borderRadius: '9px' }}
        aria-label={`${slot1.label} ${slot1.labelLine2 ?? ''}`.trim()}
      >
        <SlotImage
          src={resolveSlotImage(modules?.[1], '/assets/billboard-1/events.jpg')}
          fallbackSrc="/assets/billboard-1/events.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
        <span
          className="absolute font-display font-bold uppercase leading-[1.05] text-white"
          style={{ left: '40px', bottom: '40px', fontSize: '50px', letterSpacing: '0.02em' }}
        >
          {slot1.label}
          {slot1.labelLine2 ? (
            <>
              <br />
              {slot1.labelLine2}
            </>
          ) : null}
        </span>
      </Link>

      {/* Slot 2 — original SVG: ITINERARY BUILDER (495×208 @ 30, 1250) olive hsl(var(--brand-tertiary)).
          v2.1: solo icono reactivo al módulo asignado. El color olive es
          identidad fija del slot. */}
      <Link
        href={resolveSlotHref(modules?.[2])}
        className="absolute flex items-center overflow-hidden"
        style={{
          left: '30px',
          top: '1250px',
          width: '495px',
          height: '208px',
          borderRadius: '9px',
          backgroundColor: 'hsl(var(--brand-tertiary))',
          paddingLeft: '36px',
          paddingRight: '36px',
        }}
        aria-label={`${slot2.label} ${slot2.labelLine2 ?? ''}`.trim()}
      >
        <div
          className="font-display font-bold uppercase leading-[1.05] text-white"
          style={{ fontSize: '50px' }}
        >
          {slot2.label}
          {slot2.labelLine2 ? (
            <>
              <br />
              {slot2.labelLine2}
            </>
          ) : null}
        </div>
        <div className="ml-auto">
          <Slot2Icon size={120} color="#fff" />
        </div>
      </Link>

      {/* Slot 3 — original SVG: PHOTO BOOTH (495×208 @ 30, 1488) blue hsl(var(--brand-secondary)).
          v2.1: solo icono reactivo al módulo asignado. El color azul es
          identidad fija del slot. */}
      <Link
        href={resolveSlotHref(modules?.[3])}
        className="absolute flex items-center overflow-hidden"
        style={{
          left: '30px',
          top: '1488px',
          width: '495px',
          height: '208px',
          borderRadius: '9px',
          backgroundColor: 'hsl(var(--brand-secondary))',
          paddingLeft: '36px',
          paddingRight: '36px',
        }}
        aria-label={`${slot3.label} ${slot3.labelLine2 ?? ''}`.trim()}
      >
        <Slot3Icon size={120} color="#fff" />
        <div
          className="ml-auto font-display font-bold uppercase leading-[1.05] text-white"
          style={{ fontSize: '50px' }}
        >
          {slot3.label}
          {slot3.labelLine2 ? (
            <>
              <br />
              {slot3.labelLine2}
            </>
          ) : null}
        </div>
      </Link>

      {/* Right big card (valentino hero + TOUCH TO START + click icon) @ (555, 370) */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '555px',
          top: '370px',
          width: '495px',
          height: '1326px',
          borderRadius: '9px',
        }}
      >
        <img
          src="/assets/billboard-1/hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
        {/* TOUCH TO START text @ (804, 898) absolute → relative to card. */}
        <div
          className="absolute text-center font-display font-bold uppercase leading-[1.2] text-white"
          style={{ left: '0', right: '0', top: '500px', fontSize: '70px', whiteSpace: 'pre-line' }}
        >
          {t.billboard_touch_to_start ?? 'Touch\nto Start'}
        </div>
        {/* Click icon (hand with radiating lines) @ (684.773, 1205) absolute → (129, 835) relative */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="150"
          viewBox="50 50 170 180"
          fill="#fff"
          className="absolute"
          style={{ left: '200px', top: '750px' }}
          role="img"
          aria-label="Toca aquí"
        >
          <path
            d="M166.764,106.407H165.8a14.166,14.166,0,0,0-5.947,1.3,14.285,14.285,0,0,0-13.939-11.243h-.965a14.175,14.175,0,0,0-6.733,1.692,14.279,14.279,0,0,0-13.151-8.749H124.1a14.159,14.159,0,0,0-5.624,1.157V70.154A14.273,14.273,0,0,0,104.219,55.9h-.965A14.274,14.274,0,0,0,89,70.154V122.51l-6.485,4.922A23.762,23.762,0,0,0,78.4,161.3l20.238,25.02v9.944a10.939,10.939,0,0,0,10.924,10.926h50.521a10.939,10.939,0,0,0,10.926-10.926l0-9.441a45.947,45.947,0,0,0,10.011-28.576V120.665A14.28,14.28,0,0,0,166.764,106.407Zm5.626,51.84a37.32,37.32,0,0,1-8.975,24.221,4.3,4.3,0,0,0-1.036,2.805v10.993a2.3,2.3,0,0,1-2.294,2.294H109.566a2.3,2.3,0,0,1-2.292-2.294V184.794a4.316,4.316,0,0,0-.96-2.715l-21.2-26.207a15.131,15.131,0,0,1,2.616-21.567L89,133.347v11.858a4.316,4.316,0,0,0,8.632,0V70.152a5.631,5.631,0,0,1,5.626-5.626h.965a5.632,5.632,0,0,1,5.626,5.626V103.67l.022,27.875a4.315,4.315,0,0,0,4.316,4.312h0a4.315,4.315,0,0,0,4.312-4.32l-.019-27.871A5.63,5.63,0,0,1,124.1,98.04h.965a5.632,5.632,0,0,1,5.626,5.626v7.061l.019,20.818a4.315,4.315,0,0,0,4.316,4.312h0a4.316,4.316,0,0,0,4.312-4.32l-.019-20.816a5.63,5.63,0,0,1,5.624-5.626h.965a5.632,5.632,0,0,1,5.626,5.626v8.822c-.013.142-.043.281-.043.425l.022,11.58a4.314,4.314,0,0,0,4.316,4.307h.009a4.316,4.316,0,0,0,4.307-4.325l-.019-10.471c.013-.134.041-.261.041-.4a5.632,5.632,0,0,1,5.626-5.626h.962a5.632,5.632,0,0,1,5.626,5.626v37.584Z"
            transform="translate(-7.851 -12.969)"
          />
          <path
            d="M170.562,69.078H144.226a4.316,4.316,0,1,1,0-8.632h26.336a4.316,4.316,0,0,1,0,8.632Z"
            transform="translate(-23.35 -14.025)"
          />
          <path
            d="M111.054,34.968a4.318,4.318,0,0,1-4.316-4.316V4.316a4.316,4.316,0,1,1,8.632,0V30.652A4.315,4.315,0,0,1,111.054,34.968Z"
            transform="translate(-15.653)"
          />
          <path
            d="M135.144,43.585a4.316,4.316,0,0,1-3.051-7.367L150.716,17.6a4.315,4.315,0,0,1,6.1,6.1L138.2,42.321A4.3,4.3,0,0,1,135.144,43.585Z"
            transform="translate(-21.243 -3.79)"
          />
          <path
            d="M69.928,69.078H43.591a4.316,4.316,0,0,1,0-8.632H69.928a4.316,4.316,0,1,1,0,8.632Z"
            transform="translate(0 -14.025)"
          />
          <path
            d="M81.341,43.585a4.3,4.3,0,0,1-3.051-1.265L59.668,23.7a4.315,4.315,0,0,1,6.1-6.1L84.392,36.218a4.316,4.316,0,0,1-3.051,7.367Z"
            transform="translate(-4.438 -3.79)"
          />
        </svg>
      </div>

      {/* Footer 1080×194 @ y=1726 plano hsl(var(--brand-primary)): logo + accesibilidad + ENGLISH */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          bottom: '0',
          height: '194px',
          backgroundColor: 'hsl(var(--brand-primary))',
          paddingLeft: '59px',
          paddingRight: '59px',
        }}
      >
        <TrueOmniLogo slot="footer" className="h-[65px] w-auto text-white" />
        <AccessibilityIcon size={80} color="#fff" />
        <div data-billboard-no-link>
          <LanguageDropdown />
        </div>
      </div>
    </div>
  );
}
