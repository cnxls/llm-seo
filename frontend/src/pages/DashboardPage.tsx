import React, { useState, useEffect } from 'react';
import { Target, Trophy, Search, TrendingUp, ChevronRight, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../api';
import { RunSummaryData, RunSummary, ProvidersData, QueryData } from '../types';
import StatCard from '../components/dashboard/StatCard';
import Podium from '../components/dashboard/Podium';
import Leaderboard from '../components/dashboard/Leaderboard';
import ProviderPanel from '../components/dashboard/ProviderPanel';

export default function DashboardPage({ onOpenCompare }: { onOpenCompare: () => void }) {
  const [runs, setRuns] = useState<RunSummaryData[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [loading, setLoading] = useState(true);

  const [catFilter, setCatFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    api.getRuns().then(data => {
      setRuns(data);
      if (data.length > 0) setSelectedRun(data[0].name);
      else setLoading(false);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRun) return;
    setLoading(true);
    Promise.all([
      api.getRunSummary(selectedRun),
      api.getRunProviders(selectedRun),
      api.getRunQueries(selectedRun),
    ]).then(([s, p, q]) => {
      setSummary(s);
      setProviders(p);
      setQueries(q);
      setLoading(false);
    }).catch(console.error);
  }, [selectedRun]);

  if (loading || !summary || !providers) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  const target = summary.brands.find(b => b.is_target);
  const winRate = summary.total_queries > 0
    ? Math.round((target?.wins ?? 0) / summary.total_queries * 100)
    : 0;
  const targetRank = summary.brands.findIndex(b => b.is_target) + 1;

  const filteredQueries = queries.filter(q =>
    (catFilter === "all" || q.category === catFilter) &&
    (providerFilter === "all" || q.providers[providerFilter] !== undefined)
  );

  const allCategories = Array.from(new Set(queries.map(q => q.category)));

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <Select value={selectedRun} onValueChange={setSelectedRun}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a run" />
          </SelectTrigger>
          <SelectContent>
            {runs.map(r => (
              <SelectItem key={r.name} value={r.name}>
                {r.name} ({r.query_count} queries)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hero stat row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Win rate"
          icon={Trophy}
          value={winRate}
          suffix="%"
          accent
        />
        <StatCard
          label="Mentions"
          icon={Target}
          value={target?.mentions ?? 0}
        />
        <StatCard
          label="Queries"
          icon={Search}
          value={summary.total_queries}
        />
        <StatCard
          label="Rank"
          icon={TrendingUp}
          value={targetRank}
          format={(v) => `#${Math.round(v)}`}
          suffix={` of ${summary.brands.length}`}
        />
      </div>

      {/* Podium + Brand rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Podium brands={[...summary.brands].sort((a, b) => b.mentions - a.mentions)} />
          
          <Leaderboard 
            brands={[...summary.brands].sort((a, b) => b.mentions - a.mentions)} 
            onOpenCompare={onOpenCompare}
          />
        </div>

        {/* By Provider */}
        <ProviderPanel 
          providers={providers.providers.map((p, i) => {
            const pInfo: any = {
              openai: { label: 'OpenAI', sub: 'GPT-4o', color: '#10a37f' },
              anthropic: { label: 'Anthropic', sub: 'Claude Sonnet', color: '#d97757' },
              google: { label: 'Google', sub: 'Gemini 1.5 Pro', color: '#4285f4' }
            }[p] || { label: p, sub: 'Model', color: '#666' };
            return {
              id: p,
              mentions: providers.mentions[i] || 0,
              wins: providers.wins[i] || 0,
              ...pInfo
            };
          })}
        />
      </div>

      {/* Query details */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Search size={16} className="text-accent" /> Query details
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{filteredQueries.length}</span>
            </h2>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3 w-8 text-center border-r border-border">#</th>
                <th className="px-5 py-3 w-32 border-r border-border">Category</th>
                <th className="px-5 py-3 border-r border-border">Question</th>
                <th className="px-5 py-3 text-center">OpenAI</th>
                <th className="px-5 py-3 text-center">Anthropic</th>
                <th className="px-5 py-3 text-center">Google</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQueries.map(q => {
                const isExpanded = expandedRow === q.question_id;
                return (
                  <React.Fragment key={q.question_id}>
                    <tr
                      className={`hover:bg-muted/20 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/30' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : q.question_id)}
                    >
                      <td className="px-5 py-3 text-center text-muted-foreground border-r border-border">{q.question_id}</td>
                      <td className="px-5 py-3 border-r border-border"><span className="bg-muted text-[10px] px-2 py-1 rounded-md uppercase tracking-wider">{q.category}</span></td>
                      <td className="px-5 py-3 text-foreground border-r border-border flex items-center gap-2">
                        <ChevronRight size={14} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        {q.question}
                      </td>
                      {["openai", "anthropic", "google"].map(p => {
                        const pdata = q.providers[p];
                        if (!pdata) return <td key={p} className="px-5 py-3 text-center text-muted-foreground">—</td>;
                        const isWin = pdata.brands.some(b => b.is_target && b.brand === pdata.winner);
                        return (
                          <td key={p} className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isWin ? 'text-accent' : 'text-muted-foreground'}`}>
                              {isWin && <Check size={12} />} {pdata.winner}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/10 border-b-2 border-accent/20">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {Object.entries(q.providers).map(([p, pdata]) => (
                              <div key={p} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{p}</span>
                                  <span className="text-xs text-foreground bg-muted px-2 py-1 rounded">Winner: <b>{pdata.winner}</b></span>
                                </div>
                                <div className="space-y-2">
                                  {pdata.brands.slice().sort((a, b) => b.count - a.count).map(b => {
                                    const maxC = Math.max(...pdata.brands.map(x => x.count));
                                    const pct = (b.count / maxC) * 100;
                                    return (
                                      <div key={b.brand}>
                                        <div className={`flex justify-between text-xs mb-1 ${b.is_target ? 'text-accent font-bold' : 'text-foreground'}`}>
                                          <span>{b.brand} {b.is_target && '★'}</span>
                                          <span>{b.count}</span>
                                        </div>
                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${b.is_target ? 'bg-accent' : 'bg-foreground/30'}`} style={{ width: `${pct}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
