/**
 * Custom pool-deck mark — line art only, no generic 3D primitives.
 * Reads as “our lane” / water without clipart energy.
 */
export function HeroPoolMark() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-lg" aria-hidden>
      <div
        className="absolute -inset-6 rounded-[2.5rem] opacity-[0.14]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(255,255,255,0.9) 0%, transparent 55%), radial-gradient(ellipse 50% 45% at 20% 80%, rgba(255,209,102,0.35) 0%, transparent 50%)",
        }}
      />
      <svg
        viewBox="0 0 420 520"
        className="relative z-[1] h-auto w-full drop-shadow-[0_20px_50px_rgba(0,40,80,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heroLane" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="45%" stopColor="rgba(186,230,253,0.75)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
          </linearGradient>
          <linearGradient id="heroDeck" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.28)" />
          </linearGradient>
        </defs>
        {/* Pool edge / lane */}
        <path
          d="M32 380c80-48 160-52 240-28s136 76 148 148"
          stroke="url(#heroLane)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.85}
        />
        <path
          d="M48 392c72-38 148-44 220-22 52 14 96 44 120 88"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Lane tiles — subtle */}
        <g opacity={0.35}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={70 + i * 58}
              y1={400}
              x2={50 + i * 62}
              y2={470}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1"
            />
          ))}
        </g>
        {/* Swimmer — single continuous stroke */}
        <path
          d="M118 168c28-18 58-20 88-6 22 10 38 32 44 58 6 28 0 58-18 82-16 22-40 36-66 40-12 2-24 0-36-4"
          stroke="url(#heroLane)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M206 124c18 8 32 24 38 44 4 14 2 30-6 44M174 138c-22 4-40 20-48 42"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M228 198c36 10 62 40 70 78 4 22 0 46-12 66"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Kick splash marks */}
        <path
          d="M152 312c16 20 36 34 60 40M276 268c-8 28-4 58 12 82"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Deck plane */}
        <path d="M0 420h420v100H0z" fill="url(#heroDeck)" opacity={0.5} />
      </svg>
    </div>
  );
}
