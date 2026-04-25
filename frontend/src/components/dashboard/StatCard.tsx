import React, { useState, useEffect, useRef } from 'react';
import Sparkline from './Sparkline';

function useCountUp(target: number, { duration = 900, enabled = true } = {}) {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    let raf: number;
    const start = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * easeOutQuart(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

export default function StatCard({ 
  label, 
  icon: Icon, 
  value, 
  suffix, 
  prevValue, 
  history, 
  format = (v: number) => Math.round(v).toString(), 
  accent = false, 
  motion = true 
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  suffix?: string;
  prevValue?: number | null;
  history?: number[] | null;
  format?: (v: number) => string | number;
  accent?: boolean;
  motion?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const v = useCountUp(value, { enabled: motion });
  const delta = prevValue != null ? value - prevValue : null;
  const deltaPct = prevValue ? Math.round(((value - prevValue) / prevValue) * 100) : 0;

  const onMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      className={`relative bg-card border border-border rounded-xl p-5 overflow-hidden shadow-sm transition-colors hover:bg-muted/10 ${accent ? 'ring-1 ring-accent/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        {delta != null && (
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${delta >= 0 ? 'text-accent bg-accent/10' : 'text-destructive bg-destructive/10'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}%
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className={`text-3xl lg:text-4xl font-bold tabular-nums ${accent ? 'text-accent' : 'text-foreground'}`}>
          {format(v)}{suffix && <span className="text-lg font-normal text-muted-foreground ml-0.5">{suffix}</span>}
        </div>
        {history && (
          <div className="opacity-90">
            <Sparkline values={history} color={accent ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'} animated={motion} />
          </div>
        )}
      </div>

      {delta != null && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>vs previous run</span>
          <span className="tabular-nums">{prevValue}{suffix || ''} → {value}{suffix || ''}</span>
        </div>
      )}
    </div>
  );
}
