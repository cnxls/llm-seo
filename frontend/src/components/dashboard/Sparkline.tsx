

export default function Sparkline({ 
  values, 
  color = 'currentColor', 
  width = 110, 
  height = 36, 
  animated = true 
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  animated?: boolean;
}) {
  if (!values?.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y];
  });
  const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const safeColor = color.replace(/[^a-z0-9]/gi, '');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${safeColor}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${safeColor})`} style={{ opacity: animated ? undefined : 0.18 }} className="transition-all duration-1000" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="6" fill={color} opacity="0.2" className={animated ? "animate-pulse" : ""} />
    </svg>
  );
}
