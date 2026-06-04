'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePhotoSession } from '@/hooks/use-photo-session';
import { resolveAssetUrl } from '@/lib/asset-url';

import { S } from './mobile-layer';
import { PhotoSourceSheet } from './photo-source-sheet';
import { PwaPrimaryButton } from './pwa-button';
import { PlusIcon } from './signup-icons';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface PhotoTexts {
  title: string;
  subtitle: string;
  addPhoto: string;
  skipCta: string;
  saveCta: string;
  cancelCta: string;
  takePhoto: string;
  chooseGallery: string;
  cancelSheet: string;
  sizeHint: string;
}

interface CreateAccountPhotoScreenProps {
  background: string;
  /** Nombre mostrado bajo el círculo (del query param; fallback en config). */
  fullName: string;
  texts: PhotoTexts;
  /** Destino al finalizar (Skip/Save). */
  dashboardHref: string;
}

/**
 * Upload Picture — pasos 2-4 del Create Account (`/pwa/create-account/photo`).
 *
 * Una sola pantalla con estado interno: sin foto (Add photo + SKIP AND FINISH) →
 * action sheet (Take Photo / Choose From Gallery / Cancel) → foto añadida (preview +
 * SAVE AND FINISH / CANCEL). La imagen se previsualiza local (`URL.createObjectURL`),
 * no se sube a backend (mock). Render verbatim del XD (375×812 → layer ×1.04).
 */
export function CreateAccountPhotoScreen({
  background,
  fullName,
  texts,
  dashboardHref,
}: CreateAccountPhotoScreenProps) {
  const router = useRouter();
  // Blob-URL con revoke automático (evita memory leak) — C5.
  const { blobUrl: photoUrl, setBlob: setPhotoUrl } = usePhotoSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const finish = () => router.push(dashboardHref);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(background)}")` }}
      />
      <div className="absolute inset-0 bg-black/80" />

      {/* Layer 375×812 con coords verbatim del XD, escalado al canvas 390×844. */}
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        {/* Título */}
        <div
          className="absolute text-center text-white"
          style={{ left: 0, top: 99, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
        >
          {texts.title}
        </div>
        {/* Subtítulo */}
        <div
          className="absolute text-center text-white"
          style={{ left: 0, top: 156, width: 375, fontSize: 14, lineHeight: '19px', ...OPEN_SANS }}
        >
          {texts.subtitle}
        </div>

        {/* Círculo de foto */}
        {photoUrl ? (
          <div
            className="absolute overflow-hidden rounded-full"
            style={{ left: 131, top: 209, width: 112, height: 112 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="absolute flex flex-col items-center justify-center rounded-full bg-white/[0.54] text-black/[0.67]"
            style={{ left: 131, top: 209, width: 112, height: 112 }}
          >
            <PlusIcon size={26} />
            <span
              style={{ marginTop: 4, fontSize: 12, fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              {texts.addPhoto}
            </span>
          </button>
        )}

        {/* Nombre (uppercase como el XD) */}
        <div
          className="absolute text-center uppercase text-white"
          style={{ left: 0, top: 332, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
        >
          {fullName}
        </div>

        {/* Botones según estado */}
        {photoUrl ? (
          <>
            <PwaPrimaryButton
              onClick={finish}
              className="absolute rounded-[2px] uppercase"
              style={{
                left: 23,
                top: 451,
                width: 328,
                height: 46,
                fontSize: 14,
                letterSpacing: 0.5,
              }}
            >
              {texts.saveCta}
            </PwaPrimaryButton>
            <PwaPrimaryButton
              variant="outline"
              onClick={() => setPhotoUrl(null)}
              className="absolute rounded-[3px] uppercase"
              style={{
                left: 23,
                top: 516,
                width: 328,
                height: 46,
                fontSize: 14,
                letterSpacing: 0.5,
              }}
            >
              {texts.cancelCta}
            </PwaPrimaryButton>
          </>
        ) : (
          <PwaPrimaryButton
            onClick={finish}
            className="absolute rounded-[2px] uppercase"
            style={{ left: 24, top: 520, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
          >
            {texts.skipCta}
          </PwaPrimaryButton>
        )}
      </div>

      {/* Action sheet de origen de la foto (componente compartido) */}
      <PhotoSourceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        texts={texts}
        onPicked={(file) => setPhotoUrl(file)}
      />
    </div>
  );
}
