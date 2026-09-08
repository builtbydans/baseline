export function FacialTrackingOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 h-px bg-primary/50 animate-scan" />
      <svg
        viewBox="0 0 320 400"
        className="absolute inset-0 h-full w-full animate-mesh-breathe"
        fill="none"
      >
        <ellipse
          cx="160"
          cy="186"
          rx="92"
          ry="124"
          className="stroke-primary/50 animate-mesh-draw"
          strokeWidth="1.2"
        />
        <path
          d="M78 168 C96 92, 224 92, 242 168"
          className="stroke-primary/35 animate-mesh-draw"
          strokeWidth="1"
        />
        <path
          d="M96 148 C120 132, 140 132, 152 148"
          className="stroke-cyan-300/70 animate-mesh-draw"
          strokeWidth="1.2"
        />
        <path
          d="M168 148 C180 132, 200 132, 224 148"
          className="stroke-cyan-300/70 animate-mesh-draw"
          strokeWidth="1.2"
        />
        <ellipse
          cx="128"
          cy="168"
          rx="16"
          ry="10"
          className="stroke-primary/80"
          strokeWidth="1.2"
        />
        <ellipse
          cx="192"
          cy="168"
          rx="16"
          ry="10"
          className="stroke-primary/80"
          strokeWidth="1.2"
        />
        <circle cx="130" cy="169" r="3.5" className="fill-cyan-300/90" />
        <circle cx="190" cy="169" r="3.5" className="fill-cyan-300/90" />
        <path
          d="M160 168 L156 214 L170 214"
          className="stroke-primary/55 animate-mesh-draw"
          strokeWidth="1"
        />
        <path
          d="M132 248 C148 264, 172 264, 188 248"
          className="stroke-cyan-200/80 animate-mesh-draw"
          strokeWidth="1.4"
        />
        <path
          d="M88 210 L160 226 L232 210"
          className="stroke-primary/30"
          strokeWidth="0.8"
        />
        <path
          d="M100 250 L160 270 L220 250"
          className="stroke-primary/25"
          strokeWidth="0.8"
        />
        {LANDMARKS.map(([x, y], index) => (
          <circle
            key={`${x}-${y}-${index}`}
            cx={x}
            cy={y}
            r="2.1"
            className="fill-primary/80"
          />
        ))}
      </svg>
    </div>
  );
}

const LANDMARKS: Array<[number, number]> = [
  [160, 62],
  [108, 96],
  [212, 96],
  [78, 168],
  [242, 168],
  [96, 230],
  [224, 230],
  [128, 168],
  [192, 168],
  [160, 214],
  [148, 256],
  [172, 256],
  [110, 300],
  [210, 300],
  [160, 318],
];
