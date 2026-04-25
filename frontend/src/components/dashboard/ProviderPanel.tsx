
import { Target } from 'lucide-react';

export default function ProviderPanel({ providers }: { providers: any[] }) {
  const max = Math.max(...providers.map(p => p.mentions));

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold flex items-center gap-2 text-foreground">
          <Target className="w-4 h-4 text-accent" /> By provider
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Your mentions across each LLM.</p>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-4">
        {providers.map((p: any) => {
          const pct = (p.mentions / (max || 1)) * 100;
          return (
            <div key={p.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.sub}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tabular-nums text-foreground">{p.mentions}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">{p.wins} wins</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: p.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
