'use client';

export interface MapToolbarTextos {
  removeAll: string;
  showDriving: string;
  hideMarkers: string;
  share: string;
  smartRoute: string;
}

export interface MapToolbarProps {
  textos: MapToolbarTextos;
  showDriving: boolean;
  hideMarkers: boolean;
  onToggleDriving: () => void;
  onToggleHideMarkers: () => void;
  onRemoveAll: () => void;
  onShare: () => void;
  onSmartRoute: () => void;
  /** Si false, "Remove All" y "Share" se muestran disabled (rail vacío). */
  hasStops: boolean;
}

function Pill({
  label,
  onTap,
  variant = 'outline',
  disabled = false,
}: {
  label: string;
  onTap: () => void;
  variant?: 'outline' | 'solid';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className="flex h-12 items-center justify-center rounded-full px-6 text-[16px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      style={
        variant === 'solid'
          ? {
              backgroundColor: 'white',
              color: 'hsl(var(--itinerary-toolbar-bg))',
            }
          : {
              backgroundColor: 'transparent',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.75)',
            }
      }
    >
      {label}
    </button>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className="flex items-center gap-3 text-[16px] font-medium text-white"
    >
      <span
        className="relative h-[28px] w-[50px] rounded-full transition"
        style={{ backgroundColor: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }}
      >
        <span
          className="absolute top-[3px] h-[22px] w-[22px] rounded-full transition"
          style={{
            left: on ? 25 : 3,
            backgroundColor: on ? 'hsl(var(--itinerary-toolbar-bg))' : 'white',
          }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

/**
 * Bottom bar azul con: Remove All · Show Driving · Hide Markers · Smart Route
 * · Share Itinerary. Smart Route reordena los stops del rail con
 * nearest-neighbor (TSP greedy) para minimizar la distancia total recorrida.
 */
export function MapToolbar(props: MapToolbarProps) {
  const { textos, showDriving, hideMarkers } = props;
  return (
    <div
      className="absolute left-0 right-0 flex items-center gap-5 px-6 text-white"
      style={{
        bottom: 310,
        height: 86,
        backgroundColor: 'hsl(var(--itinerary-toolbar-bg))',
        zIndex: 25,
      }}
    >
      <Pill
        label={textos.removeAll}
        variant="outline"
        onTap={props.onRemoveAll}
        disabled={!props.hasStops}
      />
      <Toggle label={textos.showDriving} on={showDriving} onChange={props.onToggleDriving} />
      <Toggle label={textos.hideMarkers} on={hideMarkers} onChange={props.onToggleHideMarkers} />
      <div className="ml-auto flex items-center gap-3">
        <Pill
          label={textos.smartRoute}
          variant="outline"
          onTap={props.onSmartRoute}
          disabled={!props.hasStops}
        />
        <Pill
          label={textos.share}
          variant="solid"
          onTap={props.onShare}
          disabled={!props.hasStops}
        />
      </div>
    </div>
  );
}
