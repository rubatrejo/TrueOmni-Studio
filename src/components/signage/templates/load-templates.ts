/**
 * Side-effect imports que registran los templates conocidos en el `registry`.
 *
 * El `<SignagePlayer>` importa este archivo (no `registry.ts` directamente)
 * para asegurar que todos los templates están registrados antes de buscar
 * por id. Cada template `.tsx` llama `registerTemplate(...)` al evaluarse.
 *
 * Cuando aterrice un template nuevo (ej: `01-full-events` en DS3), añadir
 * el import aquí y queda disponible para el player automáticamente.
 */

import './PlaceholderA';
import './PlaceholderB';
// Landscape (1920×1080) — catálogo Signage Local v1.
import './01-full-events';
import './02-full-ad';
import './03-full-video-image';
import './04-video-events-ad';
import './05-video-2ads';
import './06-video-news-ad';
import './07-video-social-ad';
import './08-video-social';
// Portrait (1080×1920) — catálogo Signage Portrait v1.
import './01-full-events.portrait';
import './02-full-ad.portrait';
import './03-full-video-image.portrait';
import './04-video-events-ad.portrait';
import './05-video-2ads.portrait';
import './06-video-news-ad.portrait';
import './07-video-social-ad.portrait';
import './08-video-social.portrait';

export {};
