import { normalizeIntlWhitespace } from '@/lib/signage/dates';

import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `01-full-events` — pixel-perfect del SVG `01-full-events.svg`.
 *
 * Body region 1920×925 (viewBox `0 155 1920 925` para preservar transforms
 * verbatim del SVG fuente). Renderea el grupo `Events_Listing` con 5 events:
 *  - Event_5 (HERO izquierda 1144×925): primer evento del cliente
 *  - Event_1 (sub-hero superior derecha 774×463): segundo evento
 *  - Event_2 (small inferior 258×462): tercer evento
 *  - Event_3 (small inferior 258×462 con mask): cuarto evento
 *  - Event_4 (small inferior 258×462): quinto evento
 *
 * Imágenes consumidas desde `clients-signage/<slug>/assets/events/*.jpg` vía
 * el route handler `/signage-assets/<slug>/...`.
 *
 * Tokens consumidos:
 *  - `--signage-events-accent` (label olive `#b9bd39` por default)
 *  - `--signage-text-on-brand` (textos blancos)
 *  - `#1796d6` overlay del bottom band — TODO tokenizar en sub-fase tardía
 *    (es color del overlay, no brand del cliente).
 *
 * Día y mes se derivan de `event.startsAt` con locale del cliente.
 */

interface DayLabel {
  weekday: string;
  day: string;
}

/**
 * Parsea un ISO local sin sufijo de timezone como wall-clock del cliente
 * (NO convierte zonas). El operador espera que `2026-05-09T11:00:00` se
 * muestre como `11:00 am` independientemente de la zona del servidor o del
 * navegador. Para lograrlo: parseamos como UTC y formateamos como UTC, y
 * lo que pintamos es la hora literal del ISO.
 */
function parseAsWallClock(iso: string): Date {
  // Si no tiene zona explícita, le añadimos Z (treat as UTC).
  const hasTz = /Z|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso + 'Z');
}

function formatDayLabel(iso: string, locale: string): DayLabel {
  const date = parseAsWallClock(iso);
  const weekday = normalizeIntlWhitespace(
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(date),
  );
  const day = normalizeIntlWhitespace(
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  );
  return { weekday, day };
}

function formatTime(iso: string, locale: string): string {
  const date = parseAsWallClock(iso);
  const text = normalizeIntlWhitespace(
    new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date),
  );
  return text.replace(' AM', ' am').replace(' PM', ' pm');
}

function buildAssetUrl(clientSlug: string, relPath: string): string {
  return `/signage-assets/${clientSlug}/${relPath}`;
}

/**
 * Wrap de un title corto a 2 líneas. Si cabe en `maxChars` queda 1 línea;
 * si no, parte en el último espacio antes de `maxChars`.
 */
function wrapTitle(title: string, maxChars: number): [string, string] {
  if (title.length <= maxChars) return [title, ''];
  const breakIdx = title.lastIndexOf(' ', maxChars);
  if (breakIdx === -1) return [title.slice(0, maxChars), title.slice(maxChars)];
  return [title.slice(0, breakIdx), title.slice(breakIdx + 1)];
}

function Render({ client }: SignageTemplateRenderProps) {
  const e0 = client.events[0]; // HERO Saturday 6 / yoga
  const e1 = client.events[1]; // sub-hero Thursday 27 / baseball
  const e2 = client.events[2]; // small Sunday 30 / ski
  const e3 = client.events[3]; // small Monday 1 / music
  const e4 = client.events[4]; // small Thursday 4 / dog

  if (!e0 || !e1 || !e2 || !e3 || !e4) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-signage-warning text-signage-text">
        <p className="text-2xl">Template `01-full-events` requires 5 events</p>
      </div>
    );
  }

  const labels = [e0, e1, e2, e3, e4].map((e) => formatDayLabel(e.startsAt, client.locale));
  const times = [e0, e1, e2, e3, e4].map((e) => formatTime(e.startsAt, client.locale));

  // Small cards (Event_2/3/4) — wrap titles a 2 líneas como el SVG.
  const [t2line1, t2line2] = wrapTitle(e2.title, 18);
  const [t3line1, t3line2] = wrapTitle(e3.title, 18);
  const [t4line1, t4line2] = wrapTitle(e4.title, 18);

  return (
    <svg
      viewBox="0 155 1920 925"
      width="1920"
      height="925"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        {/* Pattern HERO — Event_5 yoga (1144×925, image 1387.379×925 con offset) */}
        <pattern id="evt-hero" width="1" height="1" viewBox="37.738 0 1144 925">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="1387.379"
            height="925"
            href={buildAssetUrl(client.slug, e0.image ?? 'assets/events/yoga.jpg')}
          />
        </pattern>
        {/* Pattern sub-hero Event_1 baseball (774×463) */}
        <pattern id="evt-subhero" width="1" height="1" viewBox="0 0 774 463">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="774"
            height="463"
            href={buildAssetUrl(client.slug, e1.image ?? 'assets/events/baseball.jpg')}
          />
        </pattern>
        {/* Pattern small Event_2 ski (258×462) */}
        <pattern id="evt-small-2" width="1" height="1" viewBox="0 0 258 462">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="258"
            height="462"
            href={buildAssetUrl(client.slug, e2.image ?? 'assets/events/ski.jpg')}
          />
        </pattern>
        {/* Pattern small Event_3 music (495.399×462 con mask 258×462) */}
        <pattern id="evt-small-3" width="1" height="1" viewBox="0 0 495.399 462">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="495.399"
            height="462"
            href={buildAssetUrl(client.slug, e3.image ?? 'assets/events/music.jpg')}
          />
        </pattern>
        <clipPath id="evt-clip-mask-3">
          <rect width="258" height="462" />
        </clipPath>
        {/* Pattern small Event_4 dog (258×462) */}
        <pattern id="evt-small-4" width="1" height="1" viewBox="0 0 258 462">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="258"
            height="462"
            href={buildAssetUrl(client.slug, e4.image ?? 'assets/events/dog.jpg')}
          />
        </pattern>
      </defs>

      {/* Events_Listing translate(0 155) — pega al body justo bajo el header */}
      <g transform="translate(0 155)">
        {/* ============================================================
            Event_5 (HERO izquierda) — translate(-159 -911.5)
            ============================================================ */}
        <g transform="translate(-159 -911.5)">
          <g transform="translate(160 911.5)">
            <rect width="1144" height="925" transform="translate(-1)" fill="url(#evt-hero)" />
            <g transform="translate(261.5 131.9)">
              <rect
                width="1144"
                height="100"
                transform="translate(-262.5 693.1)"
                fill="#1796d6"
                fillOpacity="0.903"
              />
            </g>
            <text
              transform="translate(49 865)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="22"
              fontFamily="OpenSans-Bold, Open Sans"
              fontWeight="700"
            >
              <tspan x="0" y="0">{e0.title}</tspan>
            </text>
            <text
              transform="translate(49 876)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="20"
              fontFamily="OpenSans, Open Sans"
            >
              <tspan x="0" y="21">
                {times[0]} - {e0.location ?? 'Location'}
              </tspan>
            </text>
          </g>
          <g transform="translate(159 30)">
            <rect width="205" height="177.588" transform="translate(0 911.5)" fill="hsl(var(--signage-events-accent))" />
            {/* Weekday centered horizontally en rect (rect width 205, center x=102.5) */}
            <text
              transform="translate(102.5 965.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="30"
              fontFamily="Montserrat-Medium, Montserrat"
              fontWeight="500"
              textAnchor="middle"
            >
              <tspan x="0" y="0">{labels[0]?.weekday}</tspan>
            </text>
            {/* Day centered horizontally, baseline at y=1054.5 */}
            <text
              transform="translate(102.5 1054.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="82"
              fontFamily="OpenSans, Open Sans"
              textAnchor="middle"
            >
              <tspan x="0" y="0">{labels[0]?.day}</tspan>
            </text>
          </g>
        </g>

        {/* Component_37_2 translate(1145 0) — wraps Event_1..4 (right column) */}
        <g transform="translate(1145 0)">
          {/* ============================================================
              Event_1 (sub-hero) — translate(-160 -58.5)
              ============================================================ */}
          <g transform="translate(-160 -58.5)">
            <g transform="translate(160 58.5)">
              <rect width="774" height="463" fill="url(#evt-subhero)" />
              <rect
                width="774"
                height="100"
                transform="translate(0 363)"
                fill="#1796d6"
                fillOpacity="0.897"
              />
              <text
                transform="translate(30 380)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="22"
                fontFamily="OpenSans-Bold, Open Sans"
                fontWeight="700"
              >
                <tspan x="0" y="24">{e1.title}</tspan>
              </text>
              <text
                transform="translate(30 420)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="20"
                fontFamily="OpenSans, Open Sans"
              >
                <tspan x="0" y="21">
                  {times[1]} - {e1.location ?? 'Location'}
                </tspan>
              </text>
            </g>
            <g transform="translate(160 30)">
              <rect
                width="160"
                height="138.588"
                transform="translate(0 58.5)"
                fill="hsl(var(--signage-events-accent))"
              />
              {/* Sub-hero rect width 160, center x=80 */}
              <text
                transform="translate(80 96.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="24"
                fontFamily="Montserrat-Medium, Montserrat"
                fontWeight="500"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[1]?.weekday}</tspan>
              </text>
              <text
                transform="translate(80 170.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="68"
                fontFamily="OpenSans, Open Sans"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[1]?.day}</tspan>
              </text>
            </g>
          </g>

          {/* ============================================================
              Event_2 (small ski) — translate(-156 349.5)
              ============================================================ */}
          <g transform="translate(-156 349.5)">
            <g transform="translate(151 113.5)">
              <rect width="258" height="462" transform="translate(5)" fill="url(#evt-small-2)" />
              <g transform="translate(258.5 2)">
                <rect
                  width="258"
                  height="100"
                  transform="translate(-253.5 359.871)"
                  fill="#1796d6"
                  fillOpacity="0.904"
                />
              </g>
              <text
                transform="translate(30 446)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="16"
                fontFamily="OpenSans, Open Sans"
              >
                <tspan x="0" y="0">
                  {times[2]} - {e2.location ?? 'Location'}
                </tspan>
              </text>
              <text
                transform="translate(30 390)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="18"
                fontFamily="OpenSans-Bold, Open Sans"
                fontWeight="700"
              >
                <tspan x="0" y="0">{t2line1}</tspan>
                {t2line2 ? (
                  <tspan x="0" y="24">
                    {t2line2}
                  </tspan>
                ) : null}
              </text>
            </g>
            <g transform="translate(156 -180)">
              <rect
                width="130"
                height="112"
                transform="translate(0 323.5)"
                fill="hsl(var(--signage-events-accent))"
              />
              {/* Small card rect width 130, center x=65 */}
              <text
                transform="translate(65 357.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="20"
                fontFamily="Montserrat-Medium, Montserrat"
                fontWeight="500"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[2]?.weekday}</tspan>
              </text>
              <text
                transform="translate(65 411.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="50"
                fontFamily="OpenSans, Open Sans"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[2]?.day}</tspan>
              </text>
            </g>
          </g>

          {/* ============================================================
              Event_3 (small music con clipPath) — translate(98 -183.5)
              ============================================================ */}
          <g transform="translate(98 -183.5)">
            <g transform="translate(160 646.5)">
              <g clipPath="url(#evt-clip-mask-3)">
                <rect
                  width="495.399"
                  height="462"
                  transform="translate(-165.787)"
                  fill="url(#evt-small-3)"
                />
              </g>
              <g transform="translate(262.501)">
                <rect
                  width="258"
                  height="100"
                  transform="translate(-262.5 362)"
                  fill="#1796d6"
                  fillOpacity="0.8"
                />
              </g>
              <text
                transform="translate(29 390)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="18"
                fontFamily="OpenSans-Bold, Open Sans"
                fontWeight="700"
              >
                <tspan x="0" y="0">{t3line1}</tspan>
                {t3line2 ? (
                  <tspan x="0" y="24">
                    {t3line2}
                  </tspan>
                ) : null}
              </text>
              <text
                transform="translate(29 420)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="16"
                fontFamily="OpenSans, Open Sans"
              >
                <tspan x="0" y="21">
                  {times[3]} - {e3.location ?? 'Location'}
                </tspan>
              </text>
            </g>
            <g transform="translate(160 30)">
              <rect
                width="130"
                height="112"
                transform="translate(0 646.5)"
                fill="hsl(var(--signage-events-accent))"
              />
              {/* Small card rect width 130, center x=65 */}
              <text
                transform="translate(65 680.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="20"
                fontFamily="Montserrat-Medium, Montserrat"
                fontWeight="500"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[3]?.weekday}</tspan>
              </text>
              <text
                transform="translate(65 734.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="50"
                fontFamily="OpenSans, Open Sans"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[3]?.day}</tspan>
              </text>
            </g>
          </g>

          {/* ============================================================
              Event_4 (small dog) — translate(356 -448.5)
              ============================================================ */}
          <g transform="translate(356 -448.5)">
            <g transform="translate(160 911.5)">
              <rect width="258" height="462" fill="url(#evt-small-4)" />
              <g transform="translate(262.532)">
                <rect
                  width="258"
                  height="100"
                  transform="translate(-262.532 362)"
                  fill="#1796d6"
                  fillOpacity="0.901"
                />
              </g>
              <text
                transform="translate(26 392)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="18"
                fontFamily="OpenSans-Bold, Open Sans"
                fontWeight="700"
              >
                <tspan x="0" y="0">{t4line1}</tspan>
                {t4line2 ? (
                  <tspan x="0" y="24">
                    {t4line2}
                  </tspan>
                ) : null}
              </text>
              <text
                transform="translate(26 445)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="16"
                fontFamily="OpenSans, Open Sans"
              >
                <tspan x="0" y="0">
                  {times[4]} - {e4.location ?? 'Location'}
                </tspan>
              </text>
            </g>
            <g transform="translate(160 30)">
              <rect
                width="130"
                height="112"
                transform="translate(0 911.5)"
                fill="hsl(var(--signage-events-accent))"
              />
              {/* Small card rect width 130, center x=65 */}
              <text
                transform="translate(65 945.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="20"
                fontFamily="Montserrat-Medium, Montserrat"
                fontWeight="500"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[4]?.weekday}</tspan>
              </text>
              <text
                transform="translate(65 999.5)"
                fill="hsl(var(--signage-text-on-brand))"
                fontSize="50"
                fontFamily="OpenSans, Open Sans"
                textAnchor="middle"
              >
                <tspan x="0" y="0">{labels[4]?.day}</tspan>
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

const FullEventsTemplate: SignageTemplate = {
  id: '01-full-events',
  label: 'Full Events',
  category: 'fullscreen',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      rect: { x: 0, y: 0, w: 1920, h: 925 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(FullEventsTemplate);

export default FullEventsTemplate;
