import type { SVGProps } from 'react';

/**
 * Small, consistent line-icon set (24x24, 1.75 stroke) so the app has one
 * coherent visual voice instead of mixed emoji glyphs across platforms.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6.5" />
      <path d="M4 12.5h4.2l1 2h5.6l1-2H20" />
      <path d="M4 12.5V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5.5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function ProjectsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 8.2c0-.94.76-1.7 1.7-1.7h4.3l1.6 2h7.2c.94 0 1.7.76 1.7 1.7v7.1c0 .94-.76 1.7-1.7 1.7H5.2c-.94 0-1.7-.76-1.7-1.7z" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.2" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18.8" cy="12" r="1.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M5 12.5l4.2 4.2L19 6.8" />
    </svg>
  );
}

export function DragHandleIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

/** Points to logical "back" (start) in LTR. Callers in RTL contexts should mirror it, e.g. via CSS transform: scaleX(-1). */
export function ChevronBackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7M18 6.5l-.8 12.3a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 6.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2" />
      <path d="M5 9v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9" />
      <path d="M10 13h4" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M6 2.5a.75.75 0 0 0-.75.75v18a.75.75 0 0 0 1.5 0v-6.02c1.1-.42 2.2-.63 3.3-.63 1.32 0 2.4.42 3.6.86 1.1.4 2.3.85 3.65.85 1.02 0 2.03-.24 3.05-.72a.75.75 0 0 0 .4-.72V5.1a.75.75 0 0 0-1.1-.66c-.9.47-1.75.68-2.6.68-1.12 0-2.1-.37-3.2-.8-1.15-.44-2.4-.92-3.9-.92-1.14 0-2.2.24-3.25.68V3.25A.75.75 0 0 0 6 2.5z" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5a1.4 1.4 0 0 1 1.22.7l7.88 13.6a1.4 1.4 0 0 1-1.22 2.1H4.12a1.4 1.4 0 0 1-1.22-2.1L10.78 3.2A1.4 1.4 0 0 1 12 2.5z" />
      <path d="M12 9v4.5" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="0.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19.5 19.5l-4.3-4.3" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M7.5 12h9M10.5 18h3" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 6.5l1.3-1.3a3.7 3.7 0 0 1 5.2 5.2L16 12" />
      <path d="M13 17.5l-1.3 1.3a3.7 3.7 0 0 1-5.2-5.2L8 12" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function TimerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V8.5M9.5 3.5h5" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M7.5 5.2a1 1 0 0 1 1.52-.85l10 6.8a1 1 0 0 1 0 1.7l-10 6.8a1 1 0 0 1-1.52-.85z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <rect x="6.5" y="4.5" width="4" height="15" rx="1" />
      <rect x="13.5" y="4.5" width="4" height="15" rx="1" />
    </svg>
  );
}

/** A simple calendar-mark in Outlook's brand blue — not the exact Microsoft logomark, paired with visible "Microsoft" text in the button. */
export function OutlookIcon(props: IconProps) {
  return (
    <svg {...base} fill="none" stroke="#0364B8" {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8.5 14.5h3v3h-3z" fill="#0364B8" stroke="none" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M11 3a1 1 0 0 1 .97.76l.9 3.62a4 4 0 0 0 2.9 2.9l3.62.9a1 1 0 0 1 0 1.94l-3.62.9a4 4 0 0 0-2.9 2.9l-.9 3.62a1 1 0 0 1-1.94 0l-.9-3.62a4 4 0 0 0-2.9-2.9l-3.62-.9a1 1 0 0 1 0-1.94l3.62-.9a4 4 0 0 0 2.9-2.9l.9-3.62A1 1 0 0 1 11 3z" />
      <path d="M18.5 2.5a.6.6 0 0 1 .58.45l.24.98a1.4 1.4 0 0 0 1.02 1.02l.98.24a.6.6 0 0 1 0 1.16l-.98.24a1.4 1.4 0 0 0-1.02 1.02l-.24.98a.6.6 0 0 1-1.16 0l-.24-.98a1.4 1.4 0 0 0-1.02-1.02l-.98-.24a.6.6 0 0 1 0-1.16l.98-.24a1.4 1.4 0 0 0 1.02-1.02l.24-.98a.6.6 0 0 1 .58-.45z" />
    </svg>
  );
}

/** Google's standard multi-color "G" logomark, per Google brand guidelines for sign-in buttons. */
export function GoogleIcon(props: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A11.998 11.998 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.73l4-3.09z" />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}
