import { ArrowRight } from 'lucide-react';

interface CompletionCardProps {
  stats: { queries: number; mentions: number; wins: number };
  runName?: string;
  onView: () => void;
  onReset: () => void;
}

function Stat({ n, l, accent }: { n: number; l: string; accent?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className={`text-3xl font-bold tabular ${accent ? 'text-accent' : 'text-foreground'}`}>{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
    </div>
  );
}

export default function CompletionCard({ stats, runName, onView, onReset }: CompletionCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-8 sweep-in relative overflow-hidden">
      <div
        className="absolute inset-0 glow-pulse"
        style={{ background: 'radial-gradient(circle at 50% 0%, hsla(104, 30%, 50%, 0.18), transparent 60%)', pointerEvents: 'none' }}
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <svg viewBox="0 0 64 64" className="w-16 h-16 mb-4">
          <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" className="ring-path" />
          <polyline points="20 33 28 41 44 25" fill="none" stroke="hsl(var(--accent))" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="check-path" />
        </svg>
        <h2 className="text-xl font-bold text-foreground mb-1">Analysis complete</h2>
        {runName && <p className="text-sm text-muted-foreground mb-6 font-mono">{runName}</p>}

        <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-6">
          <Stat n={stats.queries}  l="Queries" />
          <Stat n={stats.mentions} l="Mentions" accent />
          <Stat n={stats.wins}     l="Wins" />
        </div>

        <button onClick={onView} className="w-full max-w-md h-12 rounded-xl bg-accent text-accent-foreground font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition">
          View results <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={onReset} className="mt-3 text-xs text-muted-foreground hover:text-foreground transition">↻ Start a new run</button>
      </div>
    </div>
  );
}
