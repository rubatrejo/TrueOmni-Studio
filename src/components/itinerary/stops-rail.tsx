'use client';

import { Fragment } from 'react';

import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';
import type { ItineraryRailEntry } from '@/lib/itinerary-favorites';

import { StopSlot } from './stop-slot';

export interface StopsRailProps {
  stops: ItineraryRailEntry[];
  /** Resolver el item completo desde el slug+kind. */
  resolveItem: (entry: ItineraryRailEntry) => ItineraryCatalogItem | null;
  onRemove: (entry: ItineraryRailEntry) => void;
  visibleSlots?: number;
  startLabel: string;
  stopWord: string;
  helperText: string;
  distanceTemplate: string;
  removeAriaLabelTemplate: string;
  computeDistance?: (item: ItineraryCatalogItem) => number;
  onSlotDragStart?: (
    entry: ItineraryRailEntry,
    item: ItineraryCatalogItem,
    fromIndex: number,
    ev: React.PointerEvent<HTMLDivElement>,
  ) => void;
}

const RAIL_H = 310;
const COLUMN_W = 220;
const PILL_W = 79;
const PILL_H = 29;
const CIRCLE_DIAM = 22;
const PILL_TEXT_PAD_X = 12;
const RAIL_PAD_X = 30;
const COLUMN_GAP = 50;
const HELPER_W = 210;

/** Icono flag — verbatim del SVG `Icon_awesome-flag`. */
function FlagIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M7.858,2.11c-1.145,0-2.09-.743-3.529-.743a4.152,4.152,0,0,0-1.453.257,1.2,1.2,0,1,0-1.8.554v8.246a.513.513,0,0,0,.513.513H1.93a.513.513,0,0,0,.513-.513V8.407a5.968,5.968,0,0,1,2.444-.473c1.145,0,2.09.743,3.529.743a4.472,4.472,0,0,0,2.617-.873.682.682,0,0,0,.3-.563V2.049a.683.683,0,0,0-.972-.62,6.219,6.219,0,0,1-2.5.68Z"
        fill="hsl(var(--itinerary-slot-pill-circle-text))"
      />
    </svg>
  );
}

function Pill({
  label,
  circleContent,
}: {
  label: string;
  circleContent: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: PILL_W,
        height: PILL_H,
        borderRadius: PILL_H / 2,
        backgroundColor: 'hsl(var(--itinerary-slot-pill-bg))',
        boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: PILL_TEXT_PAD_X,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'hsl(var(--itinerary-slot-pill-text))',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'absolute',
          right: 3.5,
          top: (PILL_H - CIRCLE_DIAM) / 2,
          width: CIRCLE_DIAM,
          height: CIRCLE_DIAM,
          borderRadius: '50%',
          backgroundColor: 'hsl(var(--itinerary-slot-pill-circle))',
          color: 'hsl(var(--itinerary-slot-pill-circle-text))',
          fontSize: 12,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
        }}
      >
        {circleContent}
      </div>
    </div>
  );
}

/** Spacer entre columnas con la línea connector que conecta el pill anterior
 *  con el siguiente. La línea se extiende leftward dentro de la columna previa
 *  (donde solo está el card más abajo) hasta justo después del pill anterior,
 *  y rightward hasta justo antes del pill siguiente. Resultado: línea larga
 *  que une visualmente Start ↔ Stop 1 ↔ Stop 2 etc. */
function ConnectorSpacer() {
  // Extender la línea desde pill anterior end (column.left + PILL_W) hasta
  // pill siguiente start (next column.left). En coords del spacer:
  //   - left: -(COLUMN_W - PILL_W) + lineInset
  //   - right: lineInset
  const lineInset = 6;
  const leftExtension = -(COLUMN_W - PILL_W) + lineInset;
  return (
    <div
      style={{
        flex: `0 0 ${COLUMN_GAP}px`,
        position: 'relative',
        alignSelf: 'stretch',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: leftExtension,
          right: lineInset,
          top: PILL_H / 2 - 2,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'hsl(var(--itinerary-slot-connector))',
        }}
      />
    </div>
  );
}

/**
 * Ilustración drag&drop del extremo derecho del rail. Paths verbatim del SVG
 * `Itinerary-Drop-Bottom-Section.svg` (group `drag-drop-small`).
 */
function DragIllustration() {
  return (
    <svg
      width="150"
      height="73"
      viewBox="0 0 150 73"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M43.885,48.683H5.613A5.567,5.567,0,0,1,0,43.162V5.521A5.567,5.567,0,0,1,5.613,0H43.885A5.567,5.567,0,0,1,49.5,5.521V43.162a5.568,5.568,0,0,1-5.613,5.521"
        transform="translate(0.393 22.771)"
        fill="#fff"
        stroke="#9a9a9a"
        strokeWidth="0.6"
      />
      <path
        d="M43.885,48.683H5.613A5.568,5.568,0,0,1,0,43.162V5.521A5.568,5.568,0,0,1,5.613,0H43.885A5.567,5.567,0,0,1,49.5,5.521V43.162a5.567,5.567,0,0,1-5.613,5.521"
        transform="translate(19.249 7.852)"
        fill="#9a9897"
      />
      <path
        d="M5.64,49.469h0L5.145,49.4c-.168-.024-.343-.057-.533-.1l-.485-.117.234-.972.486.117c.147.036.3.064.442.086l.494.072-.143.987Zm38.382-.008H42.5v-1H44l.022,1Zm-3.5,0h-1.5v-1h1.5v1Zm-3.481,0h-1.5v-1h1.5v1Zm-3.48,0h-1.5v-1h1.5v1Zm-3.48,0h-1.5v-1h1.5v1Zm-3.48,0H25.1v-1h1.5v1Zm-3.48,0h-1.5v-1h1.5v1Zm-3.481,0h-1.5v-1h1.5v1Zm-3.48,0h-1.5v-1h1.5v1Zm-3.48,0h-1.5v-1h1.5v1Zm-3.48,0H7.7v-1H9.2v1Zm36.994-.614h0l-.518-.853.428-.259c.132-.081.258-.166.373-.251l.4-.3.6.8-.4.3c-.15.11-.3.212-.451.3l-.427.259ZM2.162,48.083h0l-.356-.349c-.128-.125-.252-.259-.37-.4l-.322-.382.765-.644.322.382c.093.11.193.218.306.33l.355.35-.7.711Zm46.693-1.868h0l-.923-.381.192-.462c.055-.134.1-.273.153-.425l.148-.477.955.3-.148.477c-.055.177-.117.348-.184.51l-.19.461ZM.173,44.908h0l-.078-.493c-.029-.18-.05-.361-.061-.538L0,43.377l1-.067.034.5c.01.155.026.3.049.449l.079.493-.986.157ZM49.5,42.637h-1v-1.5h1v1.495ZM1.019,41.36h-1v-1.5h1v1.5Zm48.479-2.2h-1v-1.5h1v1.5ZM1.019,37.881h-1v-1.5h1V37.88Zm48.479-2.2h-1v-1.5h1v1.5ZM1.019,34.4h-1v-1.5h1v1.5ZM49.5,32.2h-1V30.7h1v1.5ZM1.019,30.922h-1v-1.5h1v1.495ZM49.5,28.72h-1v-1.5h1v1.5ZM1.019,27.443h-1V25.948h1v1.494Zm48.479-2.2h-1v-1.5h1V25.24ZM1.019,23.964h-1v-1.5h1v1.5Zm48.479-2.2h-1v-1.5h1v1.5ZM1.019,20.485h-1v-1.5h1v1.495Zm48.479-2.2h-1v-1.5h1v1.5ZM1.019,17.006h-1v-1.5h1V17ZM49.5,14.8h-1v-1.5h1v1.5ZM1.019,13.526h-1V12.031h1v1.494Zm48.479-2.2h-1v-1.5h1v1.5ZM1.019,10.047h-1v-1.5h1v1.495ZM49.5,7.844h-1v-1.5h1v1.5ZM1.019,6.568h-1V5.995c0-.151.006-.306.018-.462l.039-.5,1,.077-.039.5c-.01.124-.014.25-.014.384v.572Zm47.3-2h0l-.188-.462c-.059-.146-.121-.279-.188-.408l-.231-.444.887-.461.23.444c.087.168.164.334.229.492l.187.463-.925.376ZM1.655,3.5h0L.842,2.92l.291-.407c.114-.158.224-.3.335-.425l.326-.38.758.652-.326.379c-.1.112-.19.232-.279.356L1.656,3.5ZM46.542,2h0l-.425-.26c-.126-.078-.259-.152-.4-.22L45.273,1.3l.445-.9.448.222c.159.079.319.167.473.263l.427.262L46.542,2ZM3.976,1.4h0L3.664.455,4.139.3c.17-.056.346-.1.521-.146L5.146.041l.228.973-.487.113c-.152.035-.3.076-.436.122L3.977,1.4ZM43.548,1h-1.5V0h1.5V1ZM40.067,1h-1.5V0h1.5V1Zm-3.48,0h-1.5V0h1.5V1Zm-3.48,0h-1.5V0h1.5V1Zm-3.48,0h-1.5V0h1.5V1Zm-3.48,0h-1.5V0h1.5V1ZM22.665,1h-1.5V0h1.5V1Zm-3.48,0h-1.5V0h1.5V1ZM15.7,1h-1.5V0h1.5V1Zm-3.48,0h-1.5V0h1.5V1ZM8.743,1h-1.5V0h1.5V1Z"
        transform="translate(100.174 21.986)"
        fill="#9a9a9a"
      />
      <path
        d="M20.723,8.687h0L0,0,8.692,20.711,12.7,16.7l7.643,7.638,4.011-4.008L16.713,12.7Z"
        transform="translate(56.176 43.972)"
        fill="rgba(0,0,0,0.87)"
      />
      <path
        d="M36.237,8.637h0l-.365-.349c-.121-.116-.243-.23-.363-.34L35.138,7.6l.676-.756.372.343c.123.115.254.237.375.354l.366.351-.69.742ZM.689,8.375h0L0,7.631l.366-.349c.116-.112.244-.231.379-.355l.374-.341.671.76-.374.341c-.121.11-.239.22-.362.338l-.366.349ZM33.618,6.348h0l-.405-.3c-.133-.1-.268-.2-.4-.291L32.4,5.462l.577-.835.411.292c.17.121.3.215.418.3l.405.3-.592.824Zm-30.3-.235h0l-.576-.835.41-.293c.127-.09.256-.18.389-.272l.032-.022L3.992,4.4l.564.846-.416.285c-.154.106-.287.2-.408.286l-.41.293Zm27.415-1.7h0L30.3,4.163c-.129-.072-.28-.155-.434-.236l-.445-.238.466-.9.445.238c.144.076.3.159.452.247l.44.247-.486.892Zm-24.5-.183h0l-.467-.9.445-.238c.134-.071.282-.149.454-.238l.449-.229.452.912-.45.229-.1.054-.335.177-.445.237ZM27.639,2.868h0l-.467-.184c-.183-.072-.325-.126-.46-.175l-.472-.175.344-.959.472.175c.167.062.328.123.48.183L28,1.917l-.364.95ZM9.359,2.74h0l-.347-.957.472-.176c.162-.061.328-.121.483-.176l.474-.166.329.965-.475.166c-.146.051-.3.106-.464.168l-.471.176Zm15.012-.97h0l-.49-.116c-.144-.034-.312-.072-.48-.108l-.492-.105.209-1,.491.105c.165.035.333.073.5.113l.49.116-.227.993ZM12.647,1.691h0l-.213-1,.491-.109c.162-.036.326-.071.5-.106l.492-.1.2,1-.493.1c-.159.032-.317.065-.482.1l-.49.108Zm8.334-.541h0l-.5-.044c-.15-.013-.31-.026-.49-.039l-.5-.033L19.554.015l.5.033c.158.011.325.024.511.04l.5.045-.087,1.016Zm-4.936-.032h0L15.971.1l.5-.037c.2-.015.362-.025.511-.033l.5-.029.055,1.02-.5.028c-.163.01-.33.02-.492.032l-.5.038Z"
        transform="translate(75.032)"
        fill="#9a9a9a"
      />
      <path
        d="M7.857,8.637H6.874V7.113h.983V8.636Zm-2.947,0H3.437V7.621H4.91V8.636Zm-3.437,0H0V7.621H1.473V8.636ZM7.857,5.081H6.874V3.557h.983V5.08Zm0-3.556H6.874V0h.983V1.524Z"
        transform="translate(105.674 2.356)"
        fill="#9a9a9a"
      />
      <path
        d="M.232,9.191h0a.79.79,0,0,1,0-1.118L8.078.232A.791.791,0,0,1,9.2,1.349L1.35,9.191a.791.791,0,0,1-1.118,0"
        transform="translate(46.748 57.321)"
        fill="rgba(0,0,0,0.87)"
      />
      <path
        d="M.241,6.826h0a.822.822,0,0,1,0-1.164L5.665.241A.823.823,0,1,1,6.83,1.4L1.406,6.826a.824.824,0,0,1-1.165,0"
        transform="translate(52.248 59.676)"
        fill="rgba(0,0,0,0.87)"
      />
    </svg>
  );
}

/**
 * Rail horizontal de stops. Cards rectangulares horizontales agrupadas a la
 * izquierda con pill arriba (texto + círculo) y línea connector entre pills.
 * Helper area (drag illustration + texto) a la derecha del último slot,
 * aislado por su propio gap; padding interno 30/30 simétrico.
 *
 * Layout horizontal (1080):
 *   [30] [card 220] [50] [card 220] [50] [card 220] [50] [helper 210] [30]
 *   = 1080 exacto en el caso de 3 slots visibles.
 *
 * Cuando `visibleSlots > 3`, se hace scroll horizontal con gap fijo y la
 * helper area sigue al final del row.
 */
export function StopsRail(props: StopsRailProps) {
  const visibleSlots = props.visibleSlots ?? Math.max(3, props.stops.length + 1);
  const slots = Array.from({ length: visibleSlots }, (_, i) => props.stops[i] ?? null);

  return (
    <div
      className="absolute left-0 right-0"
      style={{
        bottom: 0,
        height: RAIL_H,
        backgroundColor: 'hsl(var(--itinerary-rail-bg))',
        zIndex: 25,
      }}
    >
      <div
        className="h-full overflow-x-auto"
        data-itinerary-rail
        style={{
          scrollbarWidth: 'thin',
          paddingLeft: RAIL_PAD_X,
          paddingRight: RAIL_PAD_X,
          paddingTop: 30,
        }}
      >
        <div className="flex items-start">
          {slots.map((entry, i) => {
            const item = entry ? props.resolveItem(entry) : null;
            const distance =
              item && props.computeDistance ? props.computeDistance(item) : null;
            const isStart = i === 0;
            const stopNumber = i;
            const slotKey = entry ? `${entry.kind}:${entry.slug}` : `empty-${i}`;
            return (
              <Fragment key={slotKey}>
                {i > 0 && <ConnectorSpacer />}
                <div
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    width: COLUMN_W,
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <Pill
                      label={isStart ? props.startLabel : props.stopWord}
                      circleContent={isStart ? <FlagIcon /> : <span>{stopNumber}</span>}
                    />
                  </div>
                  <StopSlot
                    index={i + 1}
                    item={item}
                    onRemove={entry ? () => props.onRemove(entry) : undefined}
                    removeAriaLabel={props.removeAriaLabelTemplate.replace(
                      '{n}',
                      String(i + 1),
                    )}
                    distanceLabel={
                      distance != null
                        ? props.distanceTemplate.replace('{n}', distance.toFixed(1))
                        : undefined
                    }
                    onDragHandle={
                      entry && item && props.onSlotDragStart
                        ? (ev) => props.onSlotDragStart?.(entry, item, i, ev)
                        : undefined
                    }
                  />
                </div>
              </Fragment>
            );
          })}

          {/* Helper area al final del row */}
          <div
            style={{
              flexShrink: 0,
              width: HELPER_W,
              marginLeft: COLUMN_GAP,
              paddingTop: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <DragIllustration />
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.35,
                whiteSpace: 'pre-line',
                color: 'hsl(var(--itinerary-slot-helper-text) / 0.47)',
              }}
            >
              {props.helperText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
