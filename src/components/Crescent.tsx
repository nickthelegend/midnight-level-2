/**
 * The waxing crescent — the app's signature element and status object.
 * Illumination grows with `phase`:
 *   0 disconnected · 1 wallet connected · 2 board open (vacant) · 3 notice posted
 * When `proving`, the lit edge shimmers to signal ZK work in the dark.
 */
export function Crescent({ phase, proving = false }: { phase: 0 | 1 | 2 | 3; proving?: boolean }) {
  // How far the shadow disc is pushed left — larger reveals more lit crescent.
  // Even phase 0 keeps a clear crescent: this is the *waxing crescent*, the
  // first thread of light, never fully dark.
  const shadowOffset = [46, 64, 84, 106][phase];
  return (
    <div className="moon-stage">
      <div className="moon-stage__glow" style={{ opacity: 0.15 + phase * 0.28 }} />
      <svg
        className={`moon-svg${proving ? ' is-proving' : ''}`}
        viewBox="0 0 240 240"
        role="img"
        aria-label={`Waxing crescent, phase ${phase} of 3`}
      >
        <defs>
          <radialGradient id="litGrad" cx="74%" cy="40%" r="88%">
            <stop offset="0" stopColor="#fef8e6" />
            <stop offset="0.5" stopColor="#f4e9c8" />
            <stop offset="1" stopColor="#dccc9c" />
          </radialGradient>
          <clipPath id="moonClip">
            <circle cx="120" cy="120" r="100" />
          </clipPath>
        </defs>
        <g clipPath="url(#moonClip)">
          <circle cx="120" cy="120" r="100" fill="#0d0d16" />
          <circle className="lit" cx="120" cy="120" r="100" fill="url(#litGrad)" />
          <circle
            cx="120"
            cy="120"
            r="106"
            fill="#0b0b13"
            style={{ transform: `translateX(${-shadowOffset}px)`, transition: 'transform 0.8s cubic-bezier(.4,0,.2,1)' }}
          />
        </g>
        <circle cx="120" cy="120" r="100" fill="none" stroke="rgba(244,233,200,0.16)" strokeWidth="1" />
      </svg>
    </div>
  );
}
