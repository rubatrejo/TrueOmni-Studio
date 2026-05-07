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
import './01-full-events';
import './02-full-ad';
import './03-full-video-image';
// Próximos:
// import './02-full-ad';          // DS4
// import './03-full-video-image'; // DS5
// import './04-video-events-ad';  // DS6
// import './05-video-2ads';       // DS7
// import './06-video-news-ad';    // DS8
// import './07-video-social-ad';  // DS9
// import './08-video-social';     // DS10

export {};
