import { describe, expect, it } from 'vitest';

import { defaultFrameText, FRAME_TEXT_KIND, isTextFrame } from './photobooth-frame-meta';

describe('photobooth-frame-meta', () => {
  it('Bands lleva hashtag; Border Tab/Diagonal/Angled llevan frase', () => {
    expect(FRAME_TEXT_KIND['branded-top-bottom-bands']).toBe('hashtag');
    expect(FRAME_TEXT_KIND['branded-solid-border-tab']).toBe('phrase');
    expect(FRAME_TEXT_KIND['branded-diagonal-corners']).toBe('phrase');
    expect(FRAME_TEXT_KIND['branded-angled-band']).toBe('phrase');
  });

  it('isTextFrame solo para frames con texto', () => {
    expect(isTextFrame('branded-top-bottom-bands')).toBe(true);
    expect(isTextFrame('branded-photo-frame')).toBe(false);
    expect(isTextFrame(undefined)).toBe(false);
  });

  it('default "Visit + Cliente" para frase y "#Visit…" para hashtag', () => {
    expect(defaultFrameText('phrase', 'Discover DeKalb')).toBe('Visit Discover DeKalb');
    expect(defaultFrameText('hashtag', 'Discover DeKalb')).toBe('#VisitDiscoverDeKalb');
  });
});
