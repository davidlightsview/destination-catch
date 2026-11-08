// Destination Catch badge: a map pin with a fish swimming through it.
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 3C19.3 3 9 13.1 9 25.6 9 42.4 32 61 32 61s23-18.6 23-35.4C55 13.1 44.7 3 32 3z" fill="#e8571e" />
      <circle cx="32" cy="25" r="15.5" fill="#0b2f3c" />
      <path d="M19.5 25.5c4.6-6.2 12.6-8 19.2-3.7l4.9-3.6-1.2 6.9 1.2 6.9-4.9-3.6c-6.6 4.3-14.6 2.5-19.2-2.9z" fill="#f5efe1" />
      <circle cx="25" cy="24.6" r="1.4" fill="#0b2f3c" />
      <path d="M14 33.5c3 1.6 6 1.6 9 0s6-1.6 9 0 6 1.6 9 0 6-1.6 9 0" stroke="#5fb3b3" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <LogoMark />
      <span className="logo-word">
        <span className="logo-top">Destination</span>
        <span className="logo-main">Catch</span>
      </span>
    </span>
  );
}
