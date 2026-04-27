'use client';

export interface MapToolbarTextos {
  removeAll: string;
  showDriving: string;
  hideMarkers: string;
  share: string;
}

export interface MapToolbarProps {
  textos: MapToolbarTextos;
  showDriving: boolean;
  hideMarkers: boolean;
  onToggleDriving: () => void;
  onToggleHideMarkers: () => void;
  onRemoveAll: () => void;
  onShare: () => void;
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
      className="flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      style={
        variant === 'solid'
          ? {
              backgroundColor: 'white',
              color: 'hsl(var(--itinerary-toolbar-bg))',
            }
          : {
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.7)',
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
      className="flex items-center gap-2 text-[13px] font-medium text-white"
    >
      <span
        className="relative h-[22px] w-[40px] rounded-full transition"
        style={{ backgroundColor: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }}
      >
        <span
          className="absolute top-[2px] h-[18px] w-[18px] rounded-full transition"
          style={{
            left: on ? 20 : 2,
            backgroundColor: on ? 'hsl(var(--itinerary-toolbar-bg))' : 'white',
          }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

/**
 * Bottom bar azul con: Remove All · Show Driving toggle · Hide Markers toggle ·
 * Share Itinerary. Renderizada encima del mapa, justo debajo del map area.
 */
export function MapToolbar(props: MapToolbarProps) {
  const { textos, showDriving, hideMarkers } = props;
  return (
    <div
      className="absolute left-0 right-0 flex items-center gap-4 px-5 text-white"
      style={{
        bottom: 310,
        height: 56,
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
      <div className="ml-auto flex items-center gap-2">
        <Pill
          label={textos.share}
          variant="solid"
          onTap={props.onShare}
          disabled={!props.hasStops}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
