import { useState, useEffect } from 'react';
import QueryPreviewList from '../components/run/QueryPreviewList';
import RunProgressPanel from '../components/run/RunProgressPanel';
import { api } from '../api';
import { PreviewQuery } from '../types';
import { Page } from '../App';

export default function RunPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [queries, setQueries] = useState<PreviewQuery[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.getPreviewQueries().then(res => {
      setQueries(res.queries || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Run Analysis</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <QueryPreviewList 
            queries={queries} 
            selectedIds={selectedIds} 
            onSelectionChange={setSelectedIds} 
          />
        </div>
        <div>
          <div className="sticky top-6">
            <RunProgressPanel 
              selectedIds={Array.from(selectedIds)} 
              onNavigate={onNavigate} 
              totalAvailable={queries.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
