'use client';

import { MediaField } from '../../../../_components/MediaField';
import { useSignageClientSlug } from '../../../_lib/signage-editor-context';

/**
 * `<SignageMediaField>` — wrapper del `<MediaField>` del kiosk con el
 * producto pre-cableado a `signage` y el slug consumido del context
 * `<SignageEditorProvider>`.
 *
 * Sustituye los `<TextField>` de "Asset URL" en los module forms del
 * editor signage (DSS5+) cuando el operador prefiere subir un archivo
 * en vez de tipear un path relativo.
 */
export interface SignageMediaFieldProps {
  label: string;
  hint: string;
  aspect?: string;
  value?: string;
  kind?: 'image' | 'video';
  onChange: (next: { src: string; kind: 'image' | 'video' } | undefined) => void;
}

export function SignageMediaField(props: SignageMediaFieldProps) {
  const clientSlug = useSignageClientSlug();
  return <MediaField {...props} product="signage" slug={clientSlug ?? undefined} />;
}
