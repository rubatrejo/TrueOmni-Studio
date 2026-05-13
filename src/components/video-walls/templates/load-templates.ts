/**
 * Side-effect entrypoint: importar este archivo registra TODOS los
 * templates video-walls en el `registry` singleton.
 *
 * VW3 + VW8 — 22 templates v1 totales (6 + 6 + 5 + 3 + 3 = 23 — incluye
 * derivados proporcionales para 4×2/2×2/2×1/1×2). Pixel-perfect contra
 * XD solo para los 6 del 3×2. Resto: geometría consistente derivada
 * matemáticamente del 3×2 con los slot renderers compartidos.
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
import './4x2/03-video-image-social';
import './4x2/04-video-image-ad-events';
import './4x2/05-video-image-social-wall';
import './4x2/06-video-image-ad-social-wall';

// 2×2 (canvas 3840×2160, 16:9).
import './2x2/01-video-image-full';
import './2x2/02-quad-mix';
import './2x2/03-video-image-events';
import './2x2/04-video-image-social-wall';
import './2x2/05-video-image-ad';

// 2×1 (canvas 3840×1080, 32:9 strip horizontal).
import './2x1/01-video-image-full';
import './2x1/02-video-image-ad';
import './2x1/03-video-image-events';

// 1×2 (canvas 1920×2160, portrait stacked).
import './1x2/01-video-image-full';
import './1x2/02-video-ad-stack';
import './1x2/03-video-image-events';
