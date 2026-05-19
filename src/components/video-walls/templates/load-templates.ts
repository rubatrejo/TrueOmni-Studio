/**
 * Side-effect entrypoint: importar este archivo registra TODOS los
 * templates video-walls en el `registry` singleton.
 *
 * Catálogo cerrado: 18 templates (6 por grid × 3 grids). Pixel-perfect
 * verbatim XD para los 3 grids soportados — 3×2, 4×2 y 2×2. Cada uno
 * tiene los mismos 6 slides (Video full, +Ad, +Events, +Ad+Events,
 * +Social, +Ad+Social) ajustados a sus dimensiones físicas.
 */

// 3×2 — pixel-perfect targets contra `designs/video-walls/3x2/`.
import './3x2/01-video-image-full';
import './3x2/02-video-image-ad';
import './3x2/03-video-image-events';
import './3x2/04-video-image-ad-events';
import './3x2/05-video-image-social-wall';
import './3x2/06-video-image-ad-social-wall';

// 4×2 (canvas 7680×2160, 32:9 ultra-wide).
import './4x2/01-video-image-full';
import './4x2/02-video-image-ad';
import './4x2/03-video-image-events';
import './4x2/04-video-image-ad-events';
import './4x2/05-video-image-social-wall';
import './4x2/06-video-image-ad-social-wall';

// 2×2 (canvas 3840×2160, 16:9). Pixel-perfect contra `designs/video-walls/2x2/`.
import './2x2/01-video-image-full';
import './2x2/02-video-image-ad';
import './2x2/03-video-image-events';
import './2x2/04-video-image-ad-events';
import './2x2/05-video-image-social-wall';
import './2x2/06-video-image-ad-social-wall';
