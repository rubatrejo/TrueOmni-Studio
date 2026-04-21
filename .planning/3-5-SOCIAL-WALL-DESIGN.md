# Diseño — Módulo Social Wall (Fase 3.5)

## Contexto

El kiosk ya tiene los módulos Listings (3.3) y Events (3.4) cerrados. El tile
`social-wall` existe en el Home Dashboard pero sin módulo detrás — toca
construirlo a partir de 4 PNGs/SVGs en `~/Desktop/Social Wall/`:

- `Social Wall.png` — main (hero + Highlights + hashtag + tabs + grid masonry).
- `Social Wall-After_Scroll.png` — confirma que hero/highlights/tabs quedan
  sticky al scrollear.
- `Social Wall-Post_Image_Details.png` — modal card imagen + caption.
- `Social Wall-Post_Video_Details.png` — modal video vertical autoplay.

Motivación: los clientes quieren mostrar su presencia en redes sociales +
hashtag propio en el kiosk (lobby, conference, arena) para generar engagement.

**Decisiones del brainstorming (confirmadas):**

1. **Data**: mock en `config.json` para v1; integración real (aggregator tipo
   Curator.io o APIs directas) en v2.
2. **Tabs**: filtran el grid por red social. `All Post` + tabs por red que el
   cliente tenga configurada (X, Instagram, Pinterest, YouTube…).
3. **Highlights**: 2–4 círculos con logos de brands/eventos destacados +
   etiqueta opcional. No son stories ni filtros.
4. **Icono en cada card**: logo de la red social de origen (no es botón close).
5. **Video**: autoplay + muted + loop (estándar kiosk público).
6. **Scroll**: hero + Highlights + hashtag + tabs = **sticky**; solo scrollea
   el grid.
7. **Post types v1**: `image`, `video`, `text-only`, `gallery`.
8. **Arquitectura**: módulo del patrón `features.home.modules` con
   `kind: 'social-wall'` (simétrico a `listings`/`events`). Ruta
   `/home/social-wall`.

---

## 1. Modelo de datos

### 1.1 Tipo `SocialPost` (nuevo, `src/lib/config.ts`)

```ts
export type SocialSource = 'x' | 'instagram' | 'pinterest' | 'youtube' | 'facebook' | 'tiktok';

export type SocialPostType = 'image' | 'video' | 'text' | 'gallery';

export interface SocialAuthor {
  /** Nombre visible del autor. Ej. "Anne Smith". */
  name: string;
  /** Handle sin arroba. Ej. "annesmith". */
  username: string;
  /** Avatar URL (cuadrado). */
  avatar: string;
}

export interface SocialPost {
  id: string; // uid estable para keys
  source: SocialSource;
  type: SocialPostType;
  author: SocialAuthor;
  /** ISO 'YYYY-MM-DDTHH:MM:SSZ' — para formatear 'X hours ago'. */
  publishedAt: string;
  caption: string; // puede estar vacía si type = 'image' only
  /** Para type='image' o 'video' — URL del media principal. */
  mediaUrl?: string;
  /** Para type='video' — thumbnail para el grid. */
  videoPoster?: string;
  /** Para type='gallery' — array de URLs de imagen. */
  galleryUrls?: string[];
  /** Ratio usado por el layout masonry para reservar altura. */
  aspectRatio?: number; // width / height (default 1 si no se da)
  /** Opcional: link externo al post original (no se abre en el kiosk, es data). */
  permalink?: string;
}
```

### 1.2 Tipo `SocialHighlight`

```ts
export interface SocialHighlight {
  id: string;
  /** Imagen del círculo (logo o foto). Recomendado cuadrado 200×200. */
  image: string;
  /** Label opcional bajo el círculo (no visible en el mock actual). */
  label?: string;
}
```

### 1.3 Tipo `HomeSocialWallModule`

```ts
export interface HomeSocialWallModule {
  kind: 'social-wall';
  /** Display del tile del home ("Social Wall"). También se usa como aria-label. */
  label: string;
  /** Hero sticky (misma convención que listings/events). */
  heroImage: string;
  /** "MainHashtag" sin el '#' (lo añade la UI). */
  hashtag: string;
  /** Handles públicos por red (solo para UI decorativa — los tabs salen de las
      keys aquí presentes). Si una key no está, su tab no se muestra. */
  handles?: Partial<Record<SocialSource, string>>; // ej. {'x': '@clientx'}
  /** Círculos de Highlights (2–4 recomendado, flex si el cliente manda más). */
  highlights: SocialHighlight[];
  /** Mock posts v1. Reemplazable por un feed real en v2. */
  posts: SocialPost[];
}
```

### 1.4 Integración en `KioskConfig`

La unión `HomeModuleVariant` ya existe por Events (`HomeModule | HomeEventsModule`).
Se extiende: `HomeModule | HomeEventsModule | HomeSocialWallModule`.

### 1.5 Mock en `clients/default/config.json`

Bajo `features.home.modules['social-wall']`:

- `kind: "social-wall"`
- `label: "Social Wall"`
- `heroImage`: URL Unsplash (coast/landscape como el mock).
- `hashtag: "VisitPhoenix"` (como ejemplo — el cliente lo cambia).
- `handles`: `{ x: "@visitphoenix", instagram: "visitphoenix", pinterest: "visitphx", youtube: "@visitphoenix" }`.
- `highlights`: 3 círculos iniciales (sample brands/events).
- `posts`: ~24 mocks con mezcla de las 4 redes y 4 tipos. Imágenes Unsplash.
  ~3–4 videos cortos (URLs `.mp4` de Google cloud test videos o similares — se
  puede usar `https://commondatastorage.googleapis.com/gtv-videos-bucket/...`).
  Unos `text-only` para cubrir ese tipo.

---

## 2. Rutas

### 2.1 `/home/[module]/page.tsx`

Añadir caso:

```ts
if (mod?.kind === 'social-wall') {
  return <KioskCanvas>
    <SocialWallModule
      moduleKey={module}
      module={mod}
      header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
    />
  </KioskCanvas>;
}
```

### 2.2 Detail (no es `/[slug]` independiente)

El Post Detail se maneja como **overlay modal dentro del propio módulo**
(no usa `[slug]`). Es decir: state interno `selectedPost`. Esto evita
rutas dinámicas por cada post mock y coincide con el patrón de modales
existente en el kiosk (Weather, Filter, Directions, etc.).

---

## 3. Componentes nuevos (`src/components/social-wall/`)

### 3.1 `social-wall-module.tsx`

Orquestador. Props:
`{ moduleKey: string; module: HomeSocialWallModule; header: ReactNode }`.

Estado interno:

- `activeSource: SocialSource | 'all'` (default `'all'`).
- `selectedPost: SocialPost | null` (modal).

Layout **sticky** (todo arriba no-scrollable):

- Header hero (prop).
- `SocialWallBanner` (Highlights + hashtag sobre fondo azul).
- `SocialWallTabs`.
- Lista scrollable: `SocialWallGrid` con `posts` filtrados por `activeSource`.
- `FloatingHomeButton`.
- Modales: `SocialPostImageModal`, `SocialPostVideoModal`,
  `SocialPostTextModal`, `SocialPostGalleryModal`.

### 3.2 `social-wall-banner.tsx`

Overlay **dentro** del hero image (bottom strip), con fondo azul
`#004f8b` semi-opaco o sólido (a confirmar con SVG):

- "Highlights:" label white uppercase arriba-izquierda.
- 3 círculos (d=80, rounded-full, border white) con imagen — horizontal row
  bajo el label "Highlights:".
- A la derecha: `#` + `hashtag`, tipografía grande bold white (~34–40px).
- Ocupa ~170px de alto al bottom del hero. El hero image visible se reduce
  proporcionalmente. Pixel-perfect contra `Social Wall.svg`.

### 3.3 `social-wall-tabs.tsx`

Barra horizontal con fondo blanco y separator inferior:

- `All Post` (text + underline azul cuando activo).
- 4 iconos (X, Instagram, Pinterest, YouTube). Solo aparecen los que estén
  en `module.handles`.
- Click en un tab ⇒ `setActiveSource('x' | 'instagram' | ... )`; click en
  `All Post` ⇒ `setActiveSource('all')`.
- Altura ~80px.

### 3.4 `social-wall-grid.tsx`

Grid masonry de **3 columnas** (ancho efectivo ~1040 interno con 20 gap).

- Implementación: **CSS columns** (`column-count: 3; column-gap: 20px`) con
  `break-inside: avoid` en cada card. Es la forma más simple y rápida de
  masonry sin JS lib.
- Alternativa futura: `react-masonry-css` si el reflow no nos gusta.
- Cada `SocialPostCard` decide su altura por `aspectRatio`.

### 3.5 `social-post-card.tsx`

Card individual. Click → abre modal según tipo.

Estructura base (common):

- Imagen/video thumbnail arriba (relative, con aspectRatio).
- **Icono de red social en esquina top-right** (badge con logo blanco sobre
  fondo semi-transparente, d=32).
- **Play button** (circular 80px) centrado encima del thumbnail si
  `type === 'video'`.
- Panel azul `#1e88c6` abajo con:
  - Row: avatar (28px) + `@username` + (a la derecha) logo source icono.
  - Caption (Helvetica 14-16 white, 3-4 líneas).

Casos especiales:

- `type === 'image'` sin caption: solo imagen + badge source en corner (sin
  panel azul). Ej. card con la foto de los coches clásicos.
- `type === 'text'`: sin imagen — panel azul full card con avatar + texto
  grande + source icon bottom.
- `type === 'gallery'`: badge con número "1/N" en corner; click abre modal
  con carrousel.

### 3.6 Modales de detalle (4 variantes)

Todos overlay dark `rgba(0,0,0,0.75)` + card centered + X close top-right.

**`social-post-image-modal.tsx`** (`type === 'image'`):

- Card ~840×1400 centrada.
- Panel azul superior (~180px) con avatar+name+@username a la izquierda,
  icono source + "X hours ago" a la derecha, X close absolute right top.
- Imagen hero (aspect real, max-height).
- Panel azul inferior con caption.

**`social-post-video-modal.tsx`** (`type === 'video'`):

- Card vertical (~620×1550). Full-bleed video portrait.
- `<video autoplay muted loop playsinline />`.
- Overlay inferior con gradient-to-bottom: avatar + name + username + caption.
- Icono source + "X hours ago" overlay top-right.
- X close top-right.
- **Click en video → toggle pause/play** (útil para detenerlo).

**`social-post-text-modal.tsx`** (`type === 'text'`):

- Card ~840×900 azul sólido (no hay media).
- Avatar + name + @username + source + time arriba.
- Caption grande (28px) centrada.
- X close top-right.

**`social-post-gallery-modal.tsx`** (`type === 'gallery'`):

- Card 840×1400.
- Carrousel horizontal con **arrows** ← → + counter "1/N" overlay.
- Resto = image-modal (author + caption arriba/abajo).

---

## 4. Utils nuevos

### 4.1 `src/lib/social-date.ts`

- `timeAgo(isoOrDate: string, now = new Date()): string` — devuelve
  "just now", "5 minutes ago", "2 hours ago", "3 days ago", "2 weeks ago",
  "April 21, 2026" (cuando >4 semanas). Se usa en modales y cards.

### 4.2 `src/lib/social-sources.ts`

- `SOCIAL_SOURCE_META: Record<SocialSource, { label; color; iconPath }>` —
  centraliza el logo SVG y color oficial de cada red.
- `filterPosts(posts, source): SocialPost[]` — filtra por source o 'all'.

---

## 5. Iconografía (logos de red)

Logos dentro del proyecto (SVG inline, NO librerías externas):

- **X**: logo nuevo de Twitter (X blanca sobre fondo). Path ya disponible.
- **Instagram**: outline gradient (se simplifica a blanco sólido en card).
- **Pinterest**: "P" circular.
- **YouTube**: triangle play en rectángulo redondeado.
- **Facebook / TikTok**: añadir si se usan.

Componente `SocialSourceIcon({ source, size, color })` reusable.

---

## 6. Archivos a crear / modificar

### Crear

- `src/lib/social-date.ts`
- `src/lib/social-sources.ts`
- `src/components/social-wall/social-wall-module.tsx`
- `src/components/social-wall/social-wall-banner.tsx`
- `src/components/social-wall/social-wall-tabs.tsx`
- `src/components/social-wall/social-wall-grid.tsx`
- `src/components/social-wall/social-post-card.tsx`
- `src/components/social-wall/social-post-image-modal.tsx`
- `src/components/social-wall/social-post-video-modal.tsx`
- `src/components/social-wall/social-post-text-modal.tsx`
- `src/components/social-wall/social-post-gallery-modal.tsx`
- `src/components/social-wall/social-source-icon.tsx`

### Modificar

- `src/lib/config.ts` — añadir tipos + extender unión `HomeModuleVariant`.
- `src/app/(kiosk)/home/[module]/page.tsx` — switch por `kind: 'social-wall'`.
- `clients/default/config.json` — añadir bloque `modules['social-wall']` + ~24 posts mock.
- `clients/_template/config.json` — ejemplo mínimo.
- `clients/default/config.schema.json` + template — esquema con variante.

### No modificar

- `SearchOverlay` (v2: buscar en posts).
- `FilterOverlay`, `SortOverlay` (no aplican aquí — los tabs son el filtro).
- Listings / Events (sin cambios).

---

## 7. Diseño pixel-perfect

Protocolo de `.planning/PIXEL-PERFECT-PROTOCOL.md`:

1. Inventario de groups del SVG `Social Wall.svg` en
   `.planning/3-5-COVERAGE.md`.
2. Paths verbatim con sus transforms (iconos X, IG, Pinterest, YT).
3. Diff visual `revisor-visual` vs los 4 PNGs/SVGs.
4. Coverage check antes de commit.

Medidas clave a extraer del SVG:

- Altura exacta del banner Highlights + hashtag.
- Diámetro de los círculos Highlights.
- Padding de los tabs + underline activo.
- Padding de las cards + border-radius.
- Altura del icono source badge.

---

## 8. Verificación end-to-end

1. `pnpm kiosk:dev` → `/home/social-wall`.
2. Hero + Highlights + hashtag + tabs sticky al scrollear (no se mueven).
3. Grid masonry 3 columnas con mezcla de image/video/text/gallery posts.
4. Cada card muestra el logo de la red social correcto en la esquina.
5. Click en "Instagram" tab → solo posts con source='instagram'.
6. Click en "All Post" → vuelve a mostrar todo.
7. Click en un post image → modal con avatar+name+source+ago+imagen+caption.
8. Click en un post video → modal con video autoplay muted loop.
9. Click en video → pausa/reanuda.
10. Click en gallery → modal con arrows funcionales.
11. X cierra cualquier modal. Escape también.
12. `pnpm check` limpio.
13. Playwright screenshots de main, after-scroll (scroll manual), image modal,
    video modal, gallery modal, tab filter IG, tab filter YT.

---

## 9. Scope excluido (v2)

- Integración real con aggregator (Curator.io / Walls.io) o APIs directas.
- Polling / refresh automático del feed.
- Búsqueda dentro del Social Wall.
- Moderación automática (bad words, hashtag spam).
- Interacciones "like" / "share" (solo visual).
- Multiple walls por cliente.
- i18n de las labels ("All Post", "X hours ago"). TODO i18n en STATE.md.
- Soporte a Stories (Instagram/Snapchat-style).
- Feed algorítmico (ordenado por popularidad/trending).
