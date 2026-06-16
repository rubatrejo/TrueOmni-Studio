import {
  materializeAssets,
  type MaterializeAssetsDeps,
  type MaterializeReport,
} from './materialize-assets';
import { collectImageRefs, rewriteImageRefs } from './rewrite-config-assets';

/**
 * Pipeline de localización del config para el export STANDALONE (Fase 4): une las
 * tres piezas — `collectImageRefs` (Fase 1) → `materializeAssets` (Fase 2, con el
 * adaptador real de `materialize-assets-fs`) → `rewriteImageRefs` (Fase 1). Toma
 * el config del cliente y devuelve un config nuevo con TODOS los assets en paths
 * locales (`assets/...`) y los links externos intactos, más el reporte de
 * materialización (qué se descargó/copió/falló).
 *
 * Es puro respecto a la entrada (no muta el config) — los efectos de red/disco
 * los encapsulan las `deps`.
 */
export async function localizeConfig<T>(
  config: T,
  deps: MaterializeAssetsDeps,
  opts?: { concurrency?: number },
): Promise<{ config: T; report: MaterializeReport }> {
  const refs = collectImageRefs(config);
  const { map, report } = await materializeAssets(refs, deps, opts);
  return { config: rewriteImageRefs(config, map), report };
}
