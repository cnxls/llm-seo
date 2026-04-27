import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Rocket, X } from 'lucide-react';
import { api } from '../api';
import { PreviewQuery } from '../types';
import ProviderCard from '../components/run/ProviderCard';
import CompletionCard from '../components/run/CompletionCard';
import {
  PROVIDERS,
  generateMockResponse,
  countBrandMentions,
  pickWinner,
  resetMockIndexes,
} from '../components/run/runMockData';

type Phase = 'idle' | 'launching' | 'running' | 'done';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/* ─── Query List with fly animation ─── */
function QueryList({
  queries, selectedIds, onToggle, onSelectAll, onClear, flyingId, disabled
}: {
  queries: PreviewQuery[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
  flyingId: number | null;
  disabled?: boolean;
}) {
  const [filter, setFilter] = useState('all');
  const cats = ['all', ...Array.from(new Set(queries.map(q => q.category)))];
  const visible = filter === 'all' ? queries : queries.filter(q => q.category === filter);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[560px]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex gap-2">
          <button onClick={onSelectAll} disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-foreground font-medium transition disabled:opacity-40">
            Select all
          </button>
          <button onClick={onClear} disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition disabled:opacity-40">
            Clear
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">{selectedIds.size}</span> selected
          </span>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground">
            {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {visible.map(q => {
          const checked = selectedIds.has(q.id);
          const flying = flyingId === q.id;
          return (
            <div
              key={q.id}
              onClick={() => !disabled && onToggle(q.id)}
              className={`group flex items-start gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/30 transition ${flying ? 'fly' : ''} ${disabled ? 'pointer-events-none' : ''}`}
              style={flying ? { '--dx': '420px', '--dy': '-180px' } as React.CSSProperties : undefined}
            >
              <div className={`mt-0.5 w-4 h-4 rounded border-2 grid place-items-center transition shrink-0 ${checked ? 'bg-accent border-accent' : 'border-muted-foreground'}`}>
                {checked && <Check className="w-3 h-3 text-accent-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">{q.query}</div>
                <div className="mt-1 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{q.category}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Ready Tray ─── */
function ReadyTray({ count, total, ticking }: { count: number; total: number; ticking: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ready tray</div>
          <div className={`text-3xl font-bold tabular text-foreground ${ticking ? 'tray-tick' : ''}`}>{count}</div>
        </div>
        <Rocket className="w-7 h-7 text-accent" />
      </div>
      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-[width] duration-500" style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
      </div>
      <div className="text-[11px] text-muted-foreground mt-2 tabular">{count} of {total} queries queued</div>
    </div>
  );
}

/* ─── Launch Button ─── */
function LaunchButton({ disabled, onClick, count }: { disabled: boolean; onClick: () => void; count: number }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`group w-full h-16 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all relative overflow-hidden
        ${disabled
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'bg-accent text-accent-foreground hover:scale-[1.02] active:scale-[0.99] shadow-[0_10px_30px_-5px_hsla(104,30%,40%,0.5)]'}`}
    >
      {!disabled && <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
      <Rocket className="w-5 h-5 relative z-10" />
      <span className="relative z-10">Launch run · {count} {count === 1 ? 'query' : 'queries'}</span>
    </button>
  );
}

/* ─── Overall Progress ─── */
function OverallProgress({ done, total, currentQ }: { done: number; total: number; currentQ: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" style={{ boxShadow: '0 0 8px hsl(var(--accent))' }} />
          Run in progress
        </div>
        <div className="text-sm font-bold tabular text-accent">{pct}%</div>
      </div>
      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted-foreground tabular">
        Query {done} of {total}{currentQ ? ` · "${currentQ}"` : ''}
      </div>
    </div>
  );
}

/* ============================================================
   RUN PAGE — Main orchestrator
   ============================================================ */
export default function RunPage() {
  const navigate = useNavigate();

  // Data from API
  const [queries, setQueries] = useState<PreviewQuery[]>([]);
  const [targetBrand, setTargetBrand] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const knownBrands = [targetBrand, ...competitors].filter(Boolean);

  // Phase & selection
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [runError, setRunError] = useState<string | null>(null);

  // Launch animation
  const [flyingId, setFlyingId] = useState<number | null>(null);
  const [trayCount, setTrayCount] = useState(0);
  const [trayTick, setTrayTick] = useState(false);

  // Running state
  const [doneCount, setDoneCount] = useState(0);
  const [currentQ, setCurrentQ] = useState('');
  const [currentByProvider, setCurrentByProvider] = useState<Record<string, { query: string; response: string }>>({});
  const [stateByProvider, setStateByProvider] = useState<Record<string, 'idle' | 'active' | 'done'>>({
    openai: 'idle', anthropic: 'idle', google: 'idle'
  });
  const [statsByProvider, setStatsByProvider] = useState<Record<string, { mentions: number; wins: number }>>({
    openai: { mentions: 0, wins: 0 },
    anthropic: { mentions: 0, wins: 0 },
    google: { mentions: 0, wins: 0 },
  });
  const [sseRunName, setSseRunName] = useState('');

  // Refs for values read inside the async simulation effect
  const queriesRef = useRef(queries);
  const selectedIdsRef = useRef(selectedIds);
  const targetBrandRef = useRef(targetBrand);
  const competitorsRef = useRef(competitors);
  const knownBrandsRef = useRef(knownBrands);
  useEffect(() => { queriesRef.current = queries; }, [queries]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { targetBrandRef.current = targetBrand; }, [targetBrand]);
  useEffect(() => { competitorsRef.current = competitors; }, [competitors]);
  useEffect(() => { knownBrandsRef.current = knownBrands; }, [knownBrands]);

  // Fetch queries & brand data
  useEffect(() => {
    api.getPreviewQueries().then(res => {
      setQueries(res.queries || []);
      setSelectedIds(new Set(res.queries?.slice(0, 8).map(q => q.id) || []));
    }).catch(console.error);

    api.getBrandsRaw().then((data: Record<string, unknown>) => {
      const name = data?.target?.name || data?.target || '';
      setTargetBrand(typeof name === 'string' ? name : '');
      const comps = data?.competitors || {};
      setCompetitors(typeof comps === 'object' && !Array.isArray(comps) ? Object.keys(comps) : Array.isArray(comps) ? comps : []);
    }).catch(console.error);
  }, []);

  // SSE — listen for real backend progress
  useEffect(() => {
    if (phase !== 'running' && phase !== 'launching') return;
    const unsub = api.subscribeToActiveRun(
      (msg) => {
        if (msg.run_name) setSseRunName(msg.run_name);
        if (!msg.running && msg.run_name && msg.completed > 0) {
          // Real backend run finished — jump to done
          setPhase('done');
        }
      },
      () => {}
    );
    return unsub;
  }, [phase]);

  const toggle = useCallback((id: number) => {
    setSelectedIds(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);
  const selectAll = useCallback(() => setSelectedIds(new Set(queries.map(q => q.id))), [queries]);
  const clearAll = useCallback(() => setSelectedIds(new Set()), []);

  /* ─── LAUNCH ─── */
  const launch = async () => {
    if (!selectedIds.size || phase !== 'idle') return;
    const ids = Array.from(selectedIds);
    setPhase('launching');
    setTrayCount(0);
    resetMockIndexes();
    setRunError(null);

    // Fly each query into the tray
    for (const id of ids) {
      setFlyingId(id);
      await sleep(120);
      setFlyingId(null);
      setTrayCount(c => c + 1);
      setTrayTick(true);
      setTimeout(() => setTrayTick(false), 350);
      await sleep(60);
    }
    await sleep(500);

    // Start real backend run
    try {
      await api.startRun(ids);
    } catch (err: unknown) {
      setRunError(err instanceof Error ? err.message : 'Failed to start run — is the backend running?');
      setPhase('idle');
      return;
    }

    // Switch to running phase — start visual simulation
    setPhase('running');
  };

  /* ─── VISUAL SIMULATION (runs during 'running' phase) ─── */
  useEffect(() => {
    if (phase !== 'running') return;
    let cancelled = false;

    const selectedQueries = queriesRef.current.filter(q => selectedIdsRef.current.has(q.id));
    const brand = targetBrandRef.current || 'Your Brand';
    const comps = competitorsRef.current;
    const brands = knownBrandsRef.current;

    (async () => {
      for (const q of selectedQueries) {
        if (cancelled) return;
        setCurrentQ(q.query);

        // Cycle through providers one by one
        for (const prov of PROVIDERS) {
          if (cancelled) return;

          // Mark active
          setStateByProvider(s => ({ ...s, [prov.id]: 'active' }));
          setCurrentByProvider(c => ({ ...c, [prov.id]: { query: q.query, response: '' } }));
          await sleep(180);
          if (cancelled) return;

          // Generate & inject mock response
          const text = generateMockResponse(prov.id, brand, comps);
          setCurrentByProvider(c => ({ ...c, [prov.id]: { query: q.query, response: text } }));

          // Wait for streaming text to finish (~12ms per char + buffer)
          const typingMs = text.length * 12 + 200;
          await sleep(typingMs);
          if (cancelled) return;

          // Update stats
          const winner = pickWinner(text, brand, brands);
          const mentionsHit = countBrandMentions(text, brand);
          setStatsByProvider(s => ({
            ...s,
            [prov.id]: {
              mentions: s[prov.id].mentions + mentionsHit,
              wins: s[prov.id].wins + (winner === brand ? 1 : 0),
            },
          }));
          await sleep(120);
        }

        setDoneCount(d => d + 1);
        await sleep(150);
      }

      if (!cancelled) {
        setStateByProvider({ openai: 'done', anthropic: 'done', google: 'done' });
        setCurrentQ('');
        await sleep(400);
        setPhase('done');
      }
    })();

    return () => { cancelled = true; };
  }, [phase]);

  const totalQueries = selectedIds.size;
  const totalStats = {
    queries: doneCount,
    mentions: statsByProvider.openai.mentions + statsByProvider.anthropic.mentions + statsByProvider.google.mentions,
    wins: statsByProvider.openai.wins + statsByProvider.anthropic.wins + statsByProvider.google.wins,
  };

  const reset = () => {
    setPhase('idle');
    setDoneCount(0);
    setTrayCount(0);
    setCurrentByProvider({});
    setStateByProvider({ openai: 'idle', anthropic: 'idle', google: 'idle' });
    setStatsByProvider({ openai: { mentions: 0, wins: 0 }, anthropic: { mentions: 0, wins: 0 }, google: { mentions: 0, wins: 0 } });
    setCurrentQ('');
    setSseRunName('');
    setRunError(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Run analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick queries, launch, watch {targetBrand ? <span className="text-accent font-semibold">{targetBrand}</span> : 'your brand'} get mentioned across providers in real time.
          </p>
        </div>
        <button onClick={reset} className="text-xs px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition">
          ↻ Reset
        </button>
      </div>

      {/* Error banner */}
      {runError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
          <X className="w-4 h-4 shrink-0" />
          <span className="text-sm">{runError}</span>
        </div>
      )}

      {/* ═══ IDLE PHASE ═══ */}
      {phase === 'idle' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="xl:col-span-2">
            <QueryList
              queries={queries}
              selectedIds={selectedIds}
              onToggle={toggle}
              onSelectAll={selectAll}
              onClear={clearAll}
              flyingId={null}
            />
          </div>
          <div className="space-y-4">
            <ReadyTray count={selectedIds.size} total={queries.length} ticking={false} />
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="text-sm text-muted-foreground">
                Selected queries will be sent to all 3 providers — you'll see each response stream in.
              </div>
              <LaunchButton disabled={!selectedIds.size} onClick={launch} count={selectedIds.size} />
            </div>
          </div>
        </div>
      )}

      {/* ═══ LAUNCHING PHASE ═══ */}
      {phase === 'launching' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="xl:col-span-2">
            <QueryList
              queries={queries}
              selectedIds={selectedIds}
              onToggle={() => {}}
              onSelectAll={() => {}}
              onClear={() => {}}
              flyingId={flyingId}
              disabled
            />
          </div>
          <div className="space-y-4">
            <ReadyTray count={trayCount} total={totalQueries} ticking={trayTick} />
            <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground text-center">
              <div className="inline-block w-4 h-4 rounded-full border-2 border-accent border-t-transparent spin-loader mr-2 align-middle" />
              Loading queue…
            </div>
          </div>
        </div>
      )}

      {/* ═══ RUNNING PHASE ═══ */}
      {phase === 'running' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <OverallProgress done={doneCount} total={totalQueries} currentQ={currentQ} />
            </div>
            <button
              onClick={reset}
              className="bg-card border border-border rounded-xl p-5 text-sm font-semibold text-muted-foreground hover:text-[hsl(8,70%,65%)] hover:border-[hsla(8,70%,55%,0.4)] transition flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Cancel run
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PROVIDERS.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                state={stateByProvider[p.id]}
                currentQuery={currentByProvider[p.id]?.query}
                currentResponse={currentByProvider[p.id]?.response}
                mentions={statsByProvider[p.id].mentions}
                wins={statsByProvider[p.id].wins}
                targetBrand={targetBrand || 'Your Brand'}
                knownBrands={knownBrands}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ DONE PHASE ═══ */}
      {phase === 'done' && (
        <CompletionCard
          stats={totalStats}
          runName={sseRunName || undefined}
          onView={() => navigate('/dashboard')}
          onReset={reset}
        />
      )}
    </div>
  );
}
