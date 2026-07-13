import type { SocialKind } from "@/data/content";

type IconProps = { className?: string };

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.86-3.58-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.94L18.1 6.3c.39-.35-.08-.54-.6-.19L7.4 12.63l-4.83-1.51c-1.05-.33-1.07-1.05.22-1.56L20.55 2.8c.87-.33 1.64.2 1.35 1.5Z" />
    </svg>
  );
}

export function BeatStarsIcon({ className }: IconProps) {
  // Waveform bars — reads as "beats" without borrowing the trademarked logo.
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="9" width="2.6" height="6" rx="1" />
      <rect x="7" y="5" width="2.6" height="14" rx="1" />
      <rect x="11.5" y="2" width="2.6" height="20" rx="1" />
      <rect x="16" y="6" width="2.6" height="12" rx="1" />
      <rect x="20.5" y="10" width="2.6" height="4" rx="1" />
    </svg>
  );
}

export function SocialIcon({ kind, className }: { kind: SocialKind; className?: string }) {
  if (kind === "youtube") return <YouTubeIcon className={className} />;
  if (kind === "instagram") return <InstagramIcon className={className} />;
  if (kind === "beatstars") return <BeatStarsIcon className={className} />;
  return <TelegramIcon className={className} />;
}
