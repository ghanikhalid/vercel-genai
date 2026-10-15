import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function IconSparkle({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3c.5 4.2 2.8 6.5 7 7-4.2.5-6.5 2.8-7 7-.5-4.2-2.8-6.5-7-7 4.2-.5 6.5-2.8 7-7Z" />
      <path d="M19 16v4" />
      <path d="M17 18h4" />
    </svg>
  );
}

export function IconCookie({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 4C6.5 4 3 8.2 3 13.2c0 3.7 2.6 6.3 5.5 6.3 2 0 3.1-1.6 3.5-3.5.4 1.9 1.5 3.5 3.5 3.5 2.9 0 5.5-2.6 5.5-6.3C21 8.2 17.5 4 12 4Z" />
      <path d="M8.5 11.5c1.2-1.1 2.2-1.6 3.5-1.6s2.3.5 3.5 1.6" />
      <path d="M15.5 17.5l4.2 1.2-.8-3.2" />
    </svg>
  );
}

export function IconCamera({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M16.5 9.5h.01" />
    </svg>
  );
}

export function IconUser({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5c1.5-3 4-4.5 6.5-4.5s5 1.5 6.5 4.5" />
    </svg>
  );
}

export function IconDice({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconVoteUp({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

export function IconVoteDown({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconHeroLineScene({ size = 96, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Minimalist playful line-art laptop + iced cup + stars */}
      <rect x="20" y="20" width="56" height="38" rx="6" />
      <path d="M12 58h72l-5 8H17l-5-8Z" />
      <path d="M42 36c2 2 6 2 8 0" />
      <circle cx="38" cy="31" r="1.5" fill="currentColor" />
      <circle cx="54" cy="31" r="1.5" fill="currentColor" />
      {/* Iced drink cup */}
      <path d="M86 34h18l-2 30a4 4 0 0 1-4 3.6h-6A4 4 0 0 1 88 64l-2-30Z" />
      <path d="M84 34h22" />
      <path d="M88 34c1-5 4-8 7-8s6 3 7 8" />
      <path d="M97 26l4-10" />
      {/* Sparkle star */}
      <path d="M26 10v6M23 13h6" />
      <path d="M76 12v6M73 15h6" />
    </svg>
  );
}
