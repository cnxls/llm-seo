import { Trophy, TrendingUp, Download } from 'lucide-react';
import { BrandStat } from '../../types';

export default function Leaderboard({ brands, onOpenCompare }: { brands: BrandStat[]; onOpenCompare?: () => void }) {
  const max = brands[0]?.mentions || 1;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <Trophy className="w-4 h-4 text-accent" /> Brand leaderboard
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Mention share. Your brand is highlighted.</p>
        </div>
        <div className="flex gap-2">
          {onOpenCompare && (
            <button onClick={onOpenCompare} className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Compare
            </button>
          )}
          <button className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-semibold tracking-[0.12em]">
            <tr>
              <th className="px-5 py-2.5 w-10 text-center">#</th>
              <th className="px-5 py-2.5 text-left">Brand</th>
              <th className="px-5 py-2.5 text-left w-[40%]">Mention share</th>
              <th className="px-5 py-2.5 text-right">Mentions</th>
              <th className="px-5 py-2.5 text-right">Wins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brands.map((b, i) => {
              const pct = (b.mentions / max) * 100;
              return (
                <tr
                  key={b.brand}
                  className={`group transition-colors hover:bg-muted/20 ${b.is_target ? 'bg-accent/5' : ''}`}
                >
                  <td className="px-5 py-3 text-center text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={b.is_target ? 'text-accent font-semibold' : 'text-foreground'}>{b.brand}</span>
                    {b.is_target && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/20 text-accent">You</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: b.is_target
                            ? 'linear-gradient(90deg, hsl(var(--accent)), hsl(104,40%,65%))'
                            : 'linear-gradient(90deg, hsl(30,8%,40%), hsl(30,8%,50%))',
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-foreground font-medium">{b.mentions}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {b.wins > 0
                      ? <span className={b.is_target ? 'text-accent font-semibold' : 'text-foreground/70'}>{b.wins}</span>
                      : <span className="text-muted-foreground">0</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
