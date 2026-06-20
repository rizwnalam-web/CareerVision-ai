interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * CareerVision AI logo — an upward career trajectory with AI milestone nodes.
 * Indigo path → emerald goal star. Works at any size; defaults to 40px.
 */
export default function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="CareerVision AI"
      role="img"
    >
      <defs>
        <linearGradient id="cv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0f2e" />
          <stop offset="100%" stopColor="#1a1454" />
        </linearGradient>
        <linearGradient id="cv-path" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
        <radialGradient id="cv-goal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cv-node" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Badge background */}
      <rect width="512" height="512" rx="110" fill="url(#cv-bg)" />
      <rect x="2" y="2" width="508" height="508" rx="109" fill="none" stroke="#4338ca" strokeWidth="2" opacity="0.4" />

      {/* Background scatter dots */}
      <circle cx="68"  cy="110" r="4"   fill="#4338ca" opacity="0.18" />
      <circle cx="128" cy="68"  r="3"   fill="#4338ca" opacity="0.14" />
      <circle cx="320" cy="420" r="4"   fill="#4338ca" opacity="0.18" />
      <circle cx="420" cy="380" r="3"   fill="#4338ca" opacity="0.14" />
      <circle cx="80"  cy="380" r="3"   fill="#4338ca" opacity="0.12" />
      <circle cx="440" cy="140" r="2.5" fill="#6366f1" opacity="0.15" />

      {/* Career trajectory path */}
      <path
        d="M 96 406 C 130 370, 160 340, 200 310 C 240 280, 272 252, 310 218 C 348 184, 376 158, 416 118"
        stroke="url(#cv-path)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Node glow halos */}
      <circle cx="96"  cy="406" r="32" fill="url(#cv-node)" opacity="0.5" />
      <circle cx="200" cy="310" r="36" fill="url(#cv-node)" opacity="0.5" />
      <circle cx="310" cy="218" r="40" fill="url(#cv-node)" opacity="0.5" />
      <circle cx="416" cy="118" r="64" fill="url(#cv-goal)"  opacity="0.5" />

      {/* Milestone nodes */}
      <circle cx="96"  cy="406" r="16" fill="#4338ca" />
      <circle cx="96"  cy="406" r="8"  fill="#6366f1" />
      <circle cx="96"  cy="406" r="3"  fill="#c7d2fe" />

      <circle cx="200" cy="310" r="18" fill="#4f46e5" />
      <circle cx="200" cy="310" r="9"  fill="#818cf8" />
      <circle cx="200" cy="310" r="3.5" fill="#e0e7ff" />

      <circle cx="310" cy="218" r="20" fill="#6366f1" />
      <circle cx="310" cy="218" r="10" fill="#a5b4fc" />
      <circle cx="310" cy="218" r="4"  fill="white"   />

      {/* Goal node (emerald star) */}
      <circle cx="416" cy="118" r="36" fill="#065f46" />
      <circle cx="416" cy="118" r="26" fill="#059669" />
      <circle cx="416" cy="118" r="16" fill="#10b981" />
      <circle cx="416" cy="118" r="7"  fill="white"   />

      {/* Star rays */}
      <line x1="416" y1="76"  x2="416" y2="62"  stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      <line x1="446" y1="88"  x2="456" y2="78"  stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      <line x1="458" y1="118" x2="472" y2="118" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      <line x1="446" y1="148" x2="456" y2="158" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      <line x1="386" y1="88"  x2="376" y2="78"  stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      <line x1="374" y1="118" x2="360" y2="118" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />

      {/* In-between connector dots */}
      <circle cx="148" cy="358" r="5" fill="#4f46e5" opacity="0.55" />
      <circle cx="255" cy="264" r="5" fill="#6366f1" opacity="0.55" />
      <circle cx="363" cy="168" r="5" fill="#818cf8" opacity="0.55" />
    </svg>
  );
}
