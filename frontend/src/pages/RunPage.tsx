import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api';
import { PreviewQuery } from '../types';
import RunProgressPanel from '../components/run/RunProgressPanel';

export default function RunPage() {
  const [queries, setQueries] = useState<PreviewQuery[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.getPreviewQueries().then(res => {
      setQueries(res.queries || []);
      setSelectedIds(new Set(res.queries?.slice(0, 5).map(q => q.id) || []));
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Run Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trigger a new backend run and watch the progress.
          </p>
        </div>
        <button 
          onClick={() => setSelectedIds(new Set())} 
          className="text-xs px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition"
        >
          ↻ Clear Selection
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-4 h-[600px] overflow-y-auto">
          {queries.map(q => (
            <div key={q.id} className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/30 transition" onClick={() => {
              const n = new Set(selectedIds);
              n.has(q.id) ? n.delete(q.id) : n.add(q.id);
              setSelectedIds(n);
            }}>
              <div className={`w-4 h-4 rounded border grid place-items-center ${selectedIds.has(q.id) ? 'bg-accent border-accent' : 'border-muted-foreground'}`}>
                {selectedIds.has(q.id) && <Check className="w-3 h-3 text-accent-foreground" />}
              </div>
              <div>
                <div className="text-sm text-foreground">{q.query}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{q.category}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <RunProgressPanel 
            selectedIds={Array.from(selectedIds)} 
            totalAvailable={queries.length} 
          />
        </div>
      </div>
    </div>
  );
}
