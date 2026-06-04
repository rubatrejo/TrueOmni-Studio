'use client';

import { useRef } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

import { CameraIcon, CloseIcon, ImageIcon } from './signup-icons';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

interface PhotoSourceSheetTexts {
  takePhoto: string;
  chooseGallery: string;
  cancelSheet: string;
  sizeHint: string;
}

/**
 * Action sheet (estilo iOS) para elegir origen de la foto: Take Photo (cámara) /
 * Choose From Gallery / Cancel. Owns los `<input type=file>` ocultos; al elegir una
 * imagen válida (≤5 MB) llama `onPicked(file)` y cierra. El consumidor crea/revoca el
 * objectURL (vía `usePhotoSession`) para no leakear blobs. Reusado por el signup
 * (Upload Picture) y Edit Profile (EDIT PHOTO).
 */
export function PhotoSourceSheet({
  open,
  onClose,
  texts,
  onPicked,
}: {
  open: boolean;
  onClose: () => void;
  texts: PhotoSourceSheetTexts;
  onPicked: (file: File) => void;
}) {
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  useEscapeToClose(open, onClose);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) return; // el hint ya explica el límite
    onPicked(file);
    onClose();
  };

  return (
    <>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={texts.takePhoto}
          className="absolute inset-0 z-30 flex items-end justify-center"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/50 focus:outline-none"
            tabIndex={-1}
          />
          <div className="relative w-full rounded-t-3xl bg-background pb-3 pt-5">
            <p
              className="mb-2 px-6 text-center text-foreground/70"
              style={{ fontSize: 13, lineHeight: '18px', ...OPEN_SANS }}
            >
              {texts.sizeHint}
            </p>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex w-full items-center gap-4 border-t border-foreground/10 px-7 py-4 text-[hsl(var(--brand-primary))]"
              style={{ fontSize: 16, ...OPEN_SANS }}
            >
              <CameraIcon size={22} />
              {texts.takePhoto}
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex w-full items-center gap-4 border-t border-foreground/10 px-7 py-4 text-[hsl(var(--brand-primary))]"
              style={{ fontSize: 16, ...OPEN_SANS }}
            >
              <ImageIcon size={22} />
              {texts.chooseGallery}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center gap-4 border-t border-foreground/10 px-7 py-4 text-red-600"
              style={{ fontSize: 16, ...OPEN_SANS }}
            >
              <CloseIcon size={22} />
              {texts.cancelSheet}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
