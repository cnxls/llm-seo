import { Check } from 'lucide-react';
import StreamingText from './StreamingText';

export interface ProviderInfo {
  id: string;
  label: string;
  sub: string;
  color: string;
  glow: string;
  initial: string;
}

interface ProviderCardProps {
  provider: ProviderInfo;
  state: 'idle' | 'active' | 'done';
  currentQuery?: string;
  currentResponse?: string;
  mentions: number;
  wins: number;
  targetBrand: string;
  knownBrands: string[];
  onResponseDone?: () => void;
}

export default function ProviderCard({
  provider, state, currentQuery, currentResponse,
  mentions, wins, targetBrand, knownBrands, onResponseDone
}: ProviderCardProps) {
  const stateClass = state === 'idle' ? 'prov-idle' : state === 'active' ? 'prov-active' : 'prov-done';

  return (
    <div
      className={`bg-card border border-border rounded-xl p-5 transition-all duration-500 ${stateClass}`}
      style={{ '--prov-color': provider.color, '--prov-glow': provider.glow } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg grid place-items-center text-white font-bold text-sm"
            style={{ background: provider.color }}
          >{provider.initial}</div>
          <div>
            <div className="font-semibold text-sm text-foreground">{provider.label}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{provider.sub}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state === 'idle' && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Standby</div>
          )}
          {state === 'active' && (
            <>
              <div className="w-2 h-2 rounded-full" style={{ background: provider.color, boxShadow: `0 0 8px ${provider.color}` }} />
              <div className="text-[10px] uppercase tracking-wider" style={{ color: provider.color }}>Streaming</div>
            </>
          )}
          {state === 'done' && (
            <>
              <Check className="w-3.5 h-3.5" style={{ color: provider.color }} />
              <div className="text-[10px] uppercase tracking-wider" style={{ color: provider.color }}>Complete</div>
            </>
          )}
        </div>
      </div>

      {/* Live tally */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-muted/30 rounded-md px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Mentions</div>
          <div key={`m-${mentions}`} className="text-xl font-bold tabular text-foreground pop">{mentions}</div>
        </div>
        <div className="bg-muted/30 rounded-md px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Wins</div>
          <div key={`w-${wins}`} className="text-xl font-bold tabular text-foreground pop" style={{ color: wins > 0 ? provider.color : undefined }}>{wins}</div>
        </div>
      </div>

      {/* Current query bubble */}
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Currently asking</div>
      <div className="bg-muted/30 border border-border/50 rounded-md p-3 mb-3 min-h-[44px]">
        <div className="text-xs text-muted-foreground italic line-clamp-2">
          {currentQuery ? `"${currentQuery}"` : (state === 'idle' ? 'Waiting…' : '—')}
        </div>
      </div>

      {/* Stream area */}
      <div className="bg-background border border-border/50 rounded-md p-3 min-h-[120px]">
        {currentResponse ? (
          <StreamingText
            text={currentResponse}
            speed={12}
            targetBrand={targetBrand}
            knownBrands={knownBrands}
            onDone={onResponseDone}
          />
        ) : (
          <div className="text-xs text-muted-foreground italic">
            {state === 'active' ? 'Awaiting response…' : 'No response yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
