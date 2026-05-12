import { formatDayLabel, formatTime } from '@/lib/signage/text-helpers';

import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `01-full-events` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/01-full-events.svg`. Estructura del SVG
 * fuente:
 *
 *  - Component_37_4 (BOTTOM row) transform(0 1371)
 *  - Component_37_5 (TOP row) transform(0 155)
 *  - Event_1 (FEATURED middle) transform(-160 849.5)
 *
 * Cada Event_X de los rows top/bottom:
 *  - transform translate(x*360, 87) donde x = 0|1|2 (col index)
 *  - Image rect 360×549 con translate(0, -87) → net y=0 dentro de Component
 *  - Band Rectangle_7 360×100 dentro de colors_genral-ui_prymary_blue translate(0 362)
 *    → band aparece en bottom (y=362..462 dentro del Component frame)
 *  - Info_With_Background olive label 130×112 fill #b9bd39 translate(0 -57)
 *  - day-name Montserrat-Medium 20 fill #fff, día número OpenSans 50 fill #fff
 *  - Title OpenSans-Bold 18 con 2 tspans (línea 1 + línea 2 y=24)
 *  - Time text OpenSans 16
 *
 * Event_1 featured: image 1080×667 (con translate -204), band 1080×100 más
 * grande, olive box 160×138.588, day OpenSans 68, day-name Montserrat-Medium 24.
 *
 * Variante portrait del template `01-full-events` landscape — comparten id
 * pero el registry los resuelve por (id, orientation).
 */

function buildAssetUrl(clientSlug: string, relPath: string): string {
  return `/signage-assets/${clientSlug}/${relPath}`;
}

interface EventLike {
  title: string;
  startsAt: string;
  image?: string | null;
  location?: string | null;
}

function Render({ client }: SignageTemplateRenderProps) {
  const e0 = client.events[0];
  const e1 = client.events[1];
  const e2 = client.events[2];
  const featured = client.events[3] ?? client.events[0];

  if (!e0 || !e1 || !e2 || !featured) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-signage-warning text-signage-text">
        <p className="text-2xl">Template `01-full-events` (portrait) requires 4 events</p>
      </div>
    );
  }

  // Top + bottom rows usan los mismos 3 events; Event order en SVG es
  // 4=col2, 3=col1, 2=col0 dentro del Component group. Los mantengo así:
  //  - col 0 → e0 (Sunday/ski)
  //  - col 1 → e1 (Monday/music)
  //  - col 2 → e2 (Thursday/dog)
  const rowEvents: EventLike[] = [e0, e1, e2];

  return (
    <svg
      viewBox="0 155 1080 1765"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        {/* Pattern per event tile — siguen los viewBox/dims del SVG fuente.
            Top/bottom small tiles: 360×549. Featured: 1080×667. */}
        <pattern id="evt-p-c0" width="1" height="1" viewBox="0 0 360 549">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="360"
            height="549"
            href={buildAssetUrl(client.slug, rowEvents[0].image ?? 'assets/events/ski.jpg')}
          />
        </pattern>
        <pattern id="evt-p-c1" width="1" height="1" viewBox="0 0 360 549">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="360"
            height="549"
            href={buildAssetUrl(client.slug, rowEvents[1].image ?? 'assets/events/music.jpg')}
          />
        </pattern>
        <pattern id="evt-p-c2" width="1" height="1" viewBox="0 0 360 549">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="360"
            height="549"
            href={buildAssetUrl(client.slug, rowEvents[2].image ?? 'assets/events/dog.jpg')}
          />
        </pattern>
        <pattern id="evt-p-featured" width="1" height="1" viewBox="0 0 1080 667">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="1080"
            height="667"
            href={buildAssetUrl(client.slug, featured.image ?? 'assets/events/baseball.jpg')}
          />
        </pattern>
      </defs>

      {/* Component_37_5 — TOP row at translate(0 155) */}
      <g transform="translate(0 155)">
        <SmallTile col={0} ev={rowEvents[0]} locale={client.locale} patternId="evt-p-c0" />
        <SmallTile col={1} ev={rowEvents[1]} locale={client.locale} patternId="evt-p-c1" />
        <SmallTile col={2} ev={rowEvents[2]} locale={client.locale} patternId="evt-p-c2" />
      </g>

      {/* Event_1 — FEATURED middle at translate(-160 849.5) */}
      <g transform="translate(-160 849.5)">
        <g transform="translate(160 58.5)">
          {/* Image 1080×667 con translate(0 -204) */}
          <rect
            width="1080"
            height="667"
            transform="translate(0 -204)"
            fill="url(#evt-p-featured)"
          />
          {/* Band 1080×100 at translate(0 363) */}
          <rect
            width="1080"
            height="100"
            transform="translate(0 363)"
            fill="hsl(var(--signage-band-overlay))"
            fillOpacity="0.897"
          />
          {/* Title — translate(30 380), font 22 OpenSans-Bold */}
          <text
            transform="translate(30 380)"
            fill="hsl(var(--signage-text-on-brand))"
            fontSize="22"
            fontFamily="var(--signage-font-body, 'Open Sans')"
            fontWeight="700"
          >
            <tspan x="0" y="24">
              {featured.title}
            </tspan>
          </text>
          {/* Time/location — translate(30 420), font 20 OpenSans */}
          <text
            transform="translate(30 420)"
            fill="hsl(var(--signage-text-on-brand))"
            fontSize="20"
            fontFamily="var(--signage-font-body, 'Open Sans')"
          >
            <tspan
              x="0"
              y="21"
            >{`${formatTime(featured.startsAt, client.locale)} - ${featured.location ?? 'Location'}`}</tspan>
          </text>
        </g>
        {/* Info_With_Background featured at translate(160 -174).
            Día-name y número centrados horizontalmente en la olive
            (textAnchor=middle con x=center=80). Los tspan x/y negativos
            del SVG XD asumen otra convención de anchor; usar middle
            evita que "Thursday" salga del olive box. */}
        <g transform="translate(160 -174)">
          <rect
            width="160"
            height="138.588"
            transform="translate(0 58.5)"
            fill="hsl(var(--signage-events-accent))"
          />
          <text
            transform="translate(80 170.5)"
            fill="hsl(var(--signage-text-on-brand))"
            fontSize="68"
            fontFamily="var(--signage-font-body, 'Open Sans')"
            textAnchor="middle"
          >
            <tspan x="0" y="0">
              {new Date(featured.startsAt).getUTCDate()}
            </tspan>
          </text>
          <text
            transform="translate(80 96.5)"
            fill="hsl(var(--signage-text-on-brand))"
            fontSize="24"
            fontFamily="var(--signage-font-display, Montserrat)"
            fontWeight="500"
            textAnchor="middle"
          >
            <tspan x="0" y="0">
              {formatDayLabel(featured.startsAt, client.locale).weekday}
            </tspan>
          </text>
        </g>
      </g>

      {/* Component_37_4 — BOTTOM row at translate(0 1371) */}
      <g transform="translate(0 1371)">
        <SmallTile col={0} ev={rowEvents[0]} locale={client.locale} patternId="evt-p-c0" />
        <SmallTile col={1} ev={rowEvents[1]} locale={client.locale} patternId="evt-p-c1" />
        <SmallTile col={2} ev={rowEvents[2]} locale={client.locale} patternId="evt-p-c2" />
      </g>
    </svg>
  );
}

interface SmallTileProps {
  col: 0 | 1 | 2;
  ev: EventLike;
  locale: string;
  patternId: string;
}

/**
 * Tile small verbatim del SVG fuente. La estructura interna respeta:
 * - Event_X transform(col*360, 87) (parent group)
 * - Image rect 360×549 transform(0, -87)
 * - Band colors_genral-ui_prymary_blue transform(0, 362) > Rectangle_7 360×100 #1796d6 opacity 0.901
 * - Title transform(26, 392) font 18 OpenSans-Bold con 2 tspans (y=0, y=24)
 * - Time transform(26, 445) font 16 OpenSans
 * - Info_With_Background transform(0, -57) > Rectangle 130×112 #b9bd39
 *   + day-name translate(65, 34) font 20 Montserrat-Medium
 *   + day number translate(65, 88) font 50 OpenSans
 */
function SmallTile({ col, ev, locale, patternId }: SmallTileProps) {
  const x = col * 360;
  const day = new Date(ev.startsAt).getUTCDate();
  const dayLabel = formatDayLabel(ev.startsAt, locale).weekday;
  const time = formatTime(ev.startsAt, locale);
  // Title wrap manual a 2 líneas: split por la primera palabra que rompe ~18 chars.
  const [t1, t2] = wrapByLength(ev.title, 18);

  return (
    <g transform={`translate(${x} 87)`}>
      <g>
        <rect width="360" height="549" transform="translate(0 -87)" fill={`url(#${patternId})`} />
        <g transform="translate(0 362)">
          <rect
            width="360"
            height="100"
            fill="hsl(var(--signage-band-overlay))"
            fillOpacity="0.901"
          />
        </g>
        <text
          transform="translate(26 392)"
          fill="hsl(var(--signage-text-on-brand))"
          fontSize="18"
          fontFamily="var(--signage-font-body, 'Open Sans')"
          fontWeight="700"
        >
          <tspan x="0" y="0">
            {t1}
          </tspan>
          {t2 ? (
            <tspan x="0" y="24">
              {t2}
            </tspan>
          ) : null}
        </text>
        <text
          transform="translate(26 445)"
          fill="hsl(var(--signage-text-on-brand))"
          fontSize="16"
          fontFamily="var(--signage-font-body, 'Open Sans')"
        >
          <tspan x="0" y="0">{`${time} - ${ev.location ?? 'Location'}`}</tspan>
        </text>
      </g>
      <g transform="translate(0 -57)">
        <rect width="130" height="112" fill="hsl(var(--signage-events-accent))" />
        <text
          transform="translate(65 34)"
          fill="hsl(var(--signage-text-on-brand))"
          fontSize="20"
          fontFamily="var(--signage-font-display, Montserrat)"
          fontWeight="500"
          textAnchor="middle"
        >
          <tspan x="0" y="0">
            {dayLabel}
          </tspan>
        </text>
        <text
          transform="translate(65 88)"
          fill="hsl(var(--signage-text-on-brand))"
          fontSize="50"
          fontFamily="var(--signage-font-body, 'Open Sans')"
          textAnchor="middle"
        >
          <tspan x="0" y="0">
            {day}
          </tspan>
        </text>
      </g>
    </g>
  );
}

function wrapByLength(input: string, charsPerLine: number): [string, string | null] {
  if (input.length <= charsPerLine) return [input, null];
  const words = input.split(/\s+/);
  let line1 = '';
  for (const w of words) {
    if ((line1 + (line1 ? ' ' : '') + w).length > charsPerLine) break;
    line1 = line1 ? `${line1} ${w}` : w;
  }
  if (!line1) {
    return [input.slice(0, charsPerLine), input.slice(charsPerLine)];
  }
  const line2 = input.slice(line1.length).trim();
  return [line1, line2.length > 0 ? line2 : null];
}

const FullEventsPortraitTemplate: SignageTemplate = {
  id: '01-full-events',
  orientation: 'portrait',
  label: 'Full Events (Portrait)',
  category: 'fullscreen',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      rect: { x: 0, y: 0, w: 1080, h: 1765 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(FullEventsPortraitTemplate);

export default FullEventsPortraitTemplate;
