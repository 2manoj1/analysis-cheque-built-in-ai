export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
     <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00f2fe" stopOpacity="1" />
        <stop offset="100%" stopColor="#4facfe" stopOpacity="1" />
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#43e97b" stopOpacity="1" />
        <stop offset="100%" stopColor="#38f9d7" stopOpacity="1" />
      </linearGradient>
      <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fa709a" stopOpacity="1" />
        <stop offset="100%" stopColor="#fee140" stopOpacity="1" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.2" />
      </filter>
      <filter id="innerGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="blur" in2="SourceAlpha" operator="in" result="inner" />
        <feMerge>
          <feMergeNode in="inner" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <circle cx="100" cy="100" r="95" fill="url(#grad1)" opacity="0.05" />

    <g transform="translate(100, 100)">
      <g transform="rotate(-8)">
        <rect
          x="-65"
          y="-40"
          width="130"
          height="80"
          rx="12"
          fill="#1a1a2e"
          opacity="0.08"
          filter="url(#shadow)"
        />
        <rect
          x="-65"
          y="-40"
          width="130"
          height="80"
          rx="12"
          fill="#ffffff"
          stroke="url(#grad1)"
          strokeWidth="2"
        />
        <rect
          x="-65"
          y="-40"
          width="130"
          height="20"
          rx="12"
          fill="url(#grad1)"
          opacity="0.1"
        />
        <circle cx="-50" cy="-30" r="6" fill="url(#grad1)" opacity="0.3" />
        <rect
          x="-38"
          y="-33"
          width="25"
          height="3"
          rx="1.5"
          fill="url(#grad1)"
          opacity="0.2"
        />
        <rect
          x="35"
          y="-33"
          width="24"
          height="6"
          rx="2"
          fill="url(#grad3)"
          opacity="0.15"
        />
        <line
          x1="-55"
          y1="-5"
          x2="20"
          y2="-5"
          stroke="#e0e0e0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="-55"
          y1="10"
          x2="10"
          y2="10"
          stroke="#e0e0e0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <text
          x="35"
          y="13"
          fontFamily="Arial, sans-serif"
          fontSize="18"
          fontWeight="bold"
          fill="url(#grad3)"
          opacity="0.3"
        >
          ₹
        </text>
        <path
          d="M 25 28 Q 35 26, 45 28"
          stroke="url(#grad1)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
          strokeLinecap="round"
        />
      </g>

      <g transform="translate(20, 10)">
        <path
          d="M -5 -15 Q -15 -15, -15 -8 Q -15 0, -10 5 Q -5 10, 0 10 Q 5 10, 10 5 Q 15 0, 15 -8 Q 15 -15, 5 -15 Q 0 -18, -5 -15 Z"
          fill="url(#grad2)"
          opacity="0.15"
          filter="url(#innerGlow)"
        />
        <path
          d="M -5 -15 Q -15 -15, -15 -8 Q -15 0, -10 5 Q -5 10, 0 10 Q 5 10, 10 5 Q 15 0, 15 -8 Q 15 -15, 5 -15 Q 0 -18, -5 -15 Z"
          fill="none"
          stroke="url(#grad2)"
          strokeWidth="2.5"
        />
        <path
          d="M -8 -8 L -4 -2 M 8 -8 L 4 -2 M -6 0 L 0 4 M 6 0 L 0 4"
          stroke="url(#grad2)"
          strokeWidth="1.5"
          opacity="0.6"
          strokeLinecap="round"
        />
        {[
          { cx: -8, cy: -8, delay: "0s" },
          { cx: 8, cy: -8, delay: "0.3s" },
          { cx: -6, cy: 0, delay: "0.6s" },
          { cx: 6, cy: 0, delay: "0.9s" },
        ].map((node, i) => (
          <circle key={i} cx={node.cx} cy={node.cy} r="2.5" fill="url(#grad2)">
            <animate
              attributeName="r"
              values="2;3;2"
              dur="1.5s"
              begin={node.delay}
              repeatCount="indefinite"
            />
          </circle>
        ))}
        <circle cx="0" cy="4" r="3" fill="url(#grad3)">
          <animate
            attributeName="r"
            values="2.5;3.5;2.5"
            dur="1.5s"
            begin="1.2s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g opacity="0.5">
        {[
          { y1: -5, y2: -15, delay: "0s" },
          { y1: 0, y2: 0, delay: "0.2s" },
          { y1: 5, y2: 15, delay: "0.4s" },
        ].map((line, i) => (
          <line
            key={i}
            x1="10"
            y1={line.y1}
            x2="-30"
            y2={line.y2}
            stroke="url(#grad2)"
            strokeWidth="1"
            strokeDasharray="3,3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="6"
              dur="0.8s"
              begin={line.delay}
              repeatCount="indefinite"
            />
          </line>
        ))}
      </g>

      <g transform="translate(-48, -25)">
        <path
          d="M 0 -8 L 6 -8 L 6 2 Q 6 6, 0 8 Q -6 6, -6 2 L -6 -8 Z"
          fill="url(#grad3)"
          opacity="0.9"
        />
        <path
          d="M -3 0 L -1 3 L 4 -3"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <g opacity="0.8">
        {[
          { cx: -20, cy: -30, dur: "2s" },
          { cx: -25, cy: -35, dur: "2.5s" },
          { cx: 30, cy: -30, dur: "3s" },
          { cx: 35, cy: 35, dur: "2.2s" },
        ].map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r="2" fill="url(#grad1)">
            <animate
              attributeName="cy"
              values={`${p.cy};${p.cy + 5};${p.cy}`}
              dur={p.dur}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur={p.dur}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>

      <g opacity="0.3">
        <rect x="-70" y="-45" width="140" height="2" fill="url(#grad2)">
          <animate
            attributeName="y"
            values="-45;45;-45"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.6;0"
            dur="3s"
            repeatCount="indefinite"
          />
        </rect>
      </g>
    </g>
  </svg>
  );
}