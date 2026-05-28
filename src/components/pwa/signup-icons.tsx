/**
 * Iconos del flujo Create Account — estilo stroke (Lucide-like), coherentes con los
 * `MailIcon`/`LockIcon` del Login. `currentColor` → el color lo controla la clase.
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function Stroke({
  size = 18,
  className,
  style,
  width = 1.8,
  children,
}: IconProps & { width?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Stroke>
  );
}

export function MailIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Stroke>
  );
}

export function FlagIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </Stroke>
  );
}

export function MapPinIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Stroke>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Stroke>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="m6 9 6 6 6-6" />
    </Stroke>
  );
}

export function CameraIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Stroke>
  );
}

export function ImageIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5L5 21" />
    </Stroke>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Stroke {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </Stroke>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Stroke {...p} width={2.4}>
      <path d="M12 5v14M5 12h14" />
    </Stroke>
  );
}
