export default function AppLogo({ className = "", style, animated = false }: { className?: string, style?: React.CSSProperties, animated?: boolean }) {
  const dots = [
    { cx: 38, cy: 38, d: 0 },    { cx: 50, cy: 38, d: 0.15 }, { cx: 62, cy: 38, d: 0.3 },
    { cx: 62, cy: 50, d: 0.45 }, { cx: 62, cy: 62, d: 0.6 },  { cx: 50, cy: 62, d: 0.75 },
    { cx: 38, cy: 62, d: 0.9 },  { cx: 38, cy: 50, d: 1.05 },
  ];
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="30" fill="#d4e3ce" />
      <g stroke="#a5b99e" strokeWidth="1.5" className={animated ? 'logo-diag' : ''}>
        <line x1="38" y1="38" x2="62" y2="62" />
        <line x1="62" y1="38" x2="38" y2="62" />
      </g>
      {animated && (
        <g fill="none" stroke="#4f6f4d" strokeWidth="1">
          <circle cx="50" cy="50" r="6" className="logo-ring logo-ring-1" />
          <circle cx="50" cy="50" r="6" className="logo-ring logo-ring-2" />
        </g>
      )}
      <g fill="#8ba284">
        {dots.map((p, i) => (
          <circle
            key={i} cx={p.cx} cy={p.cy} r="3"
            className={animated ? 'logo-dot' : ''}
            style={animated ? { animationDelay: `${p.d}s`, transformOrigin: `${p.cx}px ${p.cy}px` } : undefined}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="4.5" fill="#4f6f4d" className={animated ? 'logo-core' : ''} style={animated ? { transformOrigin: '50px 50px' } : undefined} />
    </svg>
  );
}
