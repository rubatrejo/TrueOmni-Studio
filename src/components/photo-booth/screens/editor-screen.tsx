'use client';

import { useMemo } from 'react';

import type { PhotoBoothConfig } from '@/lib/config';

import { EditorTabs, type EditorTab } from '../editor/editor-tabs';
import { OptionsCarousel, type CarouselOption } from '../editor/options-carousel';
import { ShareSidebar } from '../editor/share-sidebar';
import { StickerLayer, type PlacedSticker } from '../editor/sticker-layer';
import { StickersRow } from '../editor/stickers-row';

interface EditorResolved {
  backgrounds: Array<PhotoBoothConfig['backgrounds'][number] & { resolvedImage: string }>;
  frames: Array<PhotoBoothConfig['frames'][number] & { resolvedImage: string }>;
  filters: PhotoBoothConfig['filters'];
  stickers: Array<PhotoBoothConfig['stickers'][number] & { resolvedImage: string }>;
}

interface EditorScreenProps {
  blobUrl: string | null;
  resolved: EditorResolved;
  activeTab: EditorTab;
  onChangeTab: (tab: EditorTab) => void;
  selectedBackgroundId: string | null;
  selectedFrameId: string | null;
  selectedFilterId: string | null;
  onSelectBackground: (id: string) => void;
  onSelectFrame: (id: string) => void;
  onSelectFilter: (id: string) => void;
  stickers: PlacedSticker[];
  onAddSticker: (sticker: EditorResolved['stickers'][number]) => void;
  onUpdateSticker: (id: string, patch: Partial<PlacedSticker>) => void;
  onRemoveSticker: (id: string) => void;
  onBack: () => void;
  onShare: () => void;
  labels: {
    tabs: { backgrounds: string; frames: string; filters: string };
    ariaBack: string;
    ariaShare: string;
  };
}

/**
 * Pantalla 4-Experience del Photo Booth. Layout verbatim del SVG:
 *   - Top panel 446px con carrusel de opciones del tab activo.
 *   - Stickers row (y=455).
 *   - Tabs bar (y=605).
 *   - Foto central (x=227, y=747, w=626, h=1114).
 *   - Share sidebar (x=921, y=903).
 *   - Back button semicircle (x=0, y=1163).
 */
export function EditorScreen({
  blobUrl,
  resolved,
  activeTab,
  onChangeTab,
  selectedBackgroundId,
  selectedFrameId,
  selectedFilterId,
  onSelectBackground,
  onSelectFrame,
  onSelectFilter,
  stickers,
  onAddSticker,
  onUpdateSticker,
  onRemoveSticker,
  onBack,
  onShare,
  labels,
}: EditorScreenProps) {
  const { options, selectedId, onSelectOption, renderInside } = useMemo(() => {
    if (activeTab === 'backgrounds') {
      return {
        options: resolved.backgrounds.map<CarouselOption>((b) => ({
          id: b.id,
          imageSrc: b.resolvedImage,
          label: b.label,
        })),
        selectedId: selectedBackgroundId,
        onSelectOption: onSelectBackground,
        renderInside: undefined,
      };
    }
    if (activeTab === 'frames') {
      return {
        options: resolved.frames.map<CarouselOption>((f) => ({
          id: f.id,
          imageSrc: f.resolvedImage,
          label: f.label,
        })),
        selectedId: selectedFrameId,
        onSelectOption: onSelectFrame,
        renderInside: undefined,
      };
    }
    // filters
    const firstBgSrc = resolved.backgrounds[0]?.resolvedImage;
    return {
      options: resolved.filters.map<CarouselOption>((f) => ({
        id: f.id,
        imageSrc: firstBgSrc,
        label: f.label,
      })),
      selectedId: selectedFilterId,
      onSelectOption: onSelectFilter,
      renderInside: (opt: CarouselOption) => {
        const filter = resolved.filters.find((f) => f.id === opt.id);
        if (!filter) return null;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={opt.imageSrc}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: filter.cssFilter,
            }}
          />
        );
      },
    };
  }, [
    activeTab,
    resolved,
    selectedBackgroundId,
    selectedFrameId,
    selectedFilterId,
    onSelectBackground,
    onSelectFrame,
    onSelectFilter,
  ]);

  const selectedFilter = resolved.filters.find((f) => f.id === selectedFilterId);
  const selectedFrame = resolved.frames.find((f) => f.id === selectedFrameId);

  return (
    <div
      className="absolute inset-0"
      style={{
        width: 1080,
        height: 1920,
        background: 'hsl(var(--photo-bg))',
      }}
    >
      {/* Top panel azul */}
      <div
        className="absolute"
        style={{ left: 0, top: 0, width: 1080, height: 446, background: '#004f8b' }}
      />

      {/* Carrusel de opciones del tab activo */}
      <OptionsCarousel
        options={options}
        selectedId={selectedId}
        onSelect={onSelectOption}
        renderInside={renderInside}
      />

      {/* Stickers row */}
      <StickersRow stickers={resolved.stickers} onAdd={onAddSticker} />

      {/* Tabs */}
      <EditorTabs active={activeTab} onSelect={onChangeTab} labels={labels.tabs} />

      {/* Foto central con frame + filter aplicados */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: 227,
          top: 747,
          width: 626,
          height: 1114,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgb(0 0 0 / 0.15)',
        }}
      >
        {blobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: selectedFilter?.cssFilter ?? 'none',
            }}
          />
        ) : null}
        {selectedFrame ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedFrame.resolvedImage}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        ) : null}

        {/* Capa de stickers */}
        <StickerLayer
          stickers={stickers}
          bounds={{ width: 626, height: 1114 }}
          onUpdate={onUpdateSticker}
          onRemove={onRemoveSticker}
        />
      </div>

      {/* Share sidebar (a la derecha de la foto) */}
      <ShareSidebar onShare={onShare} ariaLabel={labels.ariaShare} />

      {/* Back button (semicircle left edge, y=1163) */}
      <button
        type="button"
        aria-label={labels.ariaBack}
        onClick={onBack}
        className="absolute"
        style={{
          left: 0,
          top: 1163,
          width: 116,
          height: 232,
          padding: 0,
          border: 'none',
          borderRadius: '0 116px 116px 0',
          background: 'hsl(var(--photo-home-btn-bg))',
          boxShadow: '0 8px 24px rgb(0 0 0 / 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={45} height={50} viewBox="0 0 45 51" aria-hidden="true">
          <path
            d="M23.489,0a4.559,4.559,0,0,1,2.242,1.624c.65.749,1.334,1.461,2,2.2a3.462,3.462,0,0,1-.015,4.885q-4.87,5.345-9.749,10.68c-.113.124-.221.253-.412.474h.614q11.722,0,23.445-.006A2.855,2.855,0,0,1,44.5,21.67a4.867,4.867,0,0,1,.31,1.708c.04,1.245.005,2.492-.005,3.738-.018,2.132-1.228,3.458-3.18,3.465-2.68.009-5.36,0-8.039,0h-16c.184.215.3.354.415.484q4.851,5.3,9.7,10.592a3.172,3.172,0,0,1,.614,4,27.824,27.824,0,0,1-3.874,4.261,2.455,2.455,0,0,1-3.356-.341c-.114-.106-.224-.217-.33-.333Q10.9,38.462,1.057,27.677a3.427,3.427,0,0,1-.636-4.1A4.415,4.415,0,0,1,1.07,22.7q9.824-10.772,19.651-21.54A4.305,4.305,0,0,1,22.5,0Z"
            fill="#fff"
          />
        </svg>
      </button>
    </div>
  );
}
