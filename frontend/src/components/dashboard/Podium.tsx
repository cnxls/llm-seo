
import { Crown } from 'lucide-react';
import { BrandStat } from '../../types';

export default function Podium({ brands, motion = true }: { brands: BrandStat[]; motion?: boolean }) {
  const top3 = brands.slice(0, 3);
  // Display order: 2nd, 1st, 3rd
  const ordered = [top3[1], top3[0], top3[2]];
  const heights: Record<number, number> = { 0: 110, 1: 150, 2: 90 }; // by display index
  const tiers = [
    { rank: 2, color: 'hsl(var(--muted-foreground))', label: '2nd', glow: 'hsla(30, 10%, 70%, 0.15)' },
    { rank: 1, color: 'hsl(var(--accent))',   label: '1st', glow: 'hsla(104, 30%, 45%, 0.22)' },
    { rank: 3, color: 'hsl(30, 20%, 40%)', label: '3rd', glow: 'hsla(24, 50%, 50%, 0.15)' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <Crown className="w-4 h-4 text-accent" /> Top contenders
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Brands most mentioned across all queries this run.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 items-end pt-4">
        {ordered.map((b, i) => {
          if (!b) return null;
          const tier = tiers[i];
          const isYou = b.is_target;
          const initials = b.brand.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div key={b.brand} className="flex flex-col items-center">
              <div
                className="flex flex-col items-center text-center w-full animate-fade-in-up"
                style={{ animationDelay: motion ? `${i * 120 + 100}ms` : '0ms' }}
              >
                {/* Avatar */}
                <div
                  className="relative w-14 h-14 rounded-full grid place-items-center font-bold text-base mb-3 border-2 shadow-md"
                  style={{
                    color: tier.color,
                    borderColor: tier.color,
                    background: `radial-gradient(circle at 30% 30%, ${tier.glow}, transparent 70%), hsl(var(--card))`,
                  }}
                >
                  {tier.rank === 1 && (
                    <Crown className="absolute -top-3.5 w-5 h-5" style={{ color: tier.color }} fill="currentColor" />
                  )}
                  <span>{initials}</span>
                  {isYou && (
                    <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent text-accent-foreground shadow-sm">You</span>
                  )}
                </div>
                <div className={`text-sm font-semibold ${isYou ? 'text-accent' : 'text-foreground'} truncate max-w-full px-2`}>{b.brand}</div>
                <div className="text-[11px] text-muted-foreground mb-2 tabular-nums">{b.mentions} mentions · {b.wins} wins</div>
              </div>

              {/* Pillar */}
              <div className="w-full relative" style={{ height: heights[i] }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md border-t-2 overflow-hidden animate-fade-in-up transition-all"
                  style={{
                    height: '100%',
                    animationDelay: motion ? `${i * 120 + 200}ms` : '0ms',
                    borderColor: tier.color,
                    background: `linear-gradient(180deg, ${tier.glow} 0%, hsl(var(--muted)) 100%)`,
                  }}
                >
                  <div
                    className="absolute top-2 left-0 right-0 text-center text-xs font-bold uppercase tracking-widest opacity-80"
                    style={{ color: tier.color }}
                  >{tier.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
