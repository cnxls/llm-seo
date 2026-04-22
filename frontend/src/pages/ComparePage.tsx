import { useState, useEffect } from 'react';
import { api } from '../api';
import { RunSummaryData, CompareData } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { GitCompare, Loader2 } from 'lucide-react';
import CompareCharts from '../components/compare/CompareCharts';

export default function ComparePage() {
  const [runs, setRuns] = useState<RunSummaryData[]>([]);
  const [runA, setRunA] = useState<string>('');
  const [runB, setRunB] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState<CompareData | null>(null);

  useEffect(() => {
    api.getRuns().then(data => {
      setRuns(data);
      if (data.length >= 2) {
        setRunB(data[0].name);
        setRunA(data[1].name); // older run
      } else if (data.length === 1) {
        setRunA(data[0].name);
        setRunB(data[0].name);
      }
    }).catch(console.error);
  }, []);

  const handleCompare = async () => {
    if (!runA || !runB) return;
    setLoading(true);
    try {
      const data = await api.compareRuns(runA, runB);
      setCompareData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Compare Runs</h1>
      
      <div className="bg-card border border-border rounded-md shadow-md p-6 flex flex-wrap items-end gap-6 relative z-10">
        <div className="space-y-2 flex-1 min-w-[250px]">
          <label className="text-sm font-medium text-muted-foreground">Baseline Run (A)</label>
          <Select value={runA} onValueChange={setRunA}>
            <SelectTrigger className="w-full bg-background border-border">
              <SelectValue placeholder="Select run A" />
            </SelectTrigger>
            <SelectContent>
              {runs.map(r => (
                <SelectItem key={`A-${r.name}`} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 flex-1 min-w-[250px]">
          <label className="text-sm font-medium text-muted-foreground">Comparison Run (B)</label>
          <Select value={runB} onValueChange={setRunB}>
            <SelectTrigger className="w-full bg-background border-border">
              <SelectValue placeholder="Select run B" />
            </SelectTrigger>
            <SelectContent>
              {runs.map(r => (
                <SelectItem key={`B-${r.name}`} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-auto">
          <Button 
            className="w-full md:w-32 bg-accent hover:bg-accent/90 shadow-md text-white transition-all" 
            onClick={handleCompare} 
            disabled={!runA || !runB || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GitCompare className="w-4 h-4 mr-2" /> Compare</>}
          </Button>
        </div>
      </div>

      {compareData && !loading && (
        <CompareCharts data={compareData} />
      )}
    </div>
  );
}
