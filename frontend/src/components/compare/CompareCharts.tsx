import { CompareData } from '../../types';
import ProviderRadarChart from '../dashboard/ProviderRadarChart';
import CategoryBarChart from '../dashboard/CategoryBarChart';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface CompareChartsProps {
  data: CompareData;
}

export default function CompareCharts({ data }: CompareChartsProps) {
  const renderStats = (runData: CompareData['run_a']) => {
    const targetBrand = runData.summary.brands.find(b => b.is_target);
    const winRate = targetBrand && runData.summary.total_queries > 0 
      ? Math.round((targetBrand.wins / runData.summary.total_queries) * 100) 
      : 0;

    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted/30 border border-border p-4 rounded-md">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Target Win Rate</p>
          <p className="text-2xl font-bold text-foreground">{winRate}%</p>
        </div>
        <div className="bg-muted/30 border border-border p-4 rounded-md">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Target Mentions</p>
          <p className="text-2xl font-bold text-foreground">{targetBrand?.mentions || 0}</p>
        </div>
      </div>
    );
  };

  const getDeltaBadge = (a: number, b: number, higherIsBetter = true) => {
    const diff = b - a;
    if (diff === 0) return <Badge variant="outline" className="bg-muted text-muted-foreground"><Minus className="w-3 h-3 mr-1"/> 0</Badge>;
    
    const isPositive = diff > 0;
    const isGood = isPositive === higherIsBetter;
    
    return (
      <Badge variant="outline" className={isGood ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
        {Math.abs(diff)}
      </Badge>
    );
  };

  const getDeltas = () => {
    const aTarget = data.run_a.summary.brands.find(b => b.is_target);
    const bTarget = data.run_b.summary.brands.find(b => b.is_target);
    
    const aWinRate = aTarget && data.run_a.summary.total_queries > 0 ? Math.round((aTarget.wins / data.run_a.summary.total_queries) * 100) : 0;
    const bWinRate = bTarget && data.run_b.summary.total_queries > 0 ? Math.round((bTarget.wins / data.run_b.summary.total_queries) * 100) : 0;

    return (
      <Card className="border border-accent border-dashed bg-card mb-6 overflow-hidden">
        <div className="bg-accent/10 px-6 py-3 border-b border-accent border-dashed">
          <h3 className="font-semibold text-accent text-sm uppercase tracking-wider">Delta (B - A)</h3>
        </div>
        <CardContent className="p-6 flex flex-wrap gap-8 items-center justify-around">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Win Rate</span>
            {getDeltaBadge(aWinRate, bWinRate, true)}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Mentions</span>
            {getDeltaBadge(aTarget?.mentions || 0, bTarget?.mentions || 0, true)}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Avg Score</span>
            {getDeltaBadge(Math.round((aTarget?.avg_score || 0)*10), Math.round((bTarget?.avg_score || 0)*10), true)}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mt-8">
      {getDeltas()}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative items-start">
        {/* Column A */}
        <div className="space-y-6 flex flex-col">
          <div className="border border-border bg-card p-4 rounded-md shadow-sm">
            <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted mb-2">Baseline</Badge>
            <h2 className="text-xl font-bold font-mono text-foreground">{data.run_a.name}</h2>
            <p className="text-sm text-accent mt-1 mr-2 px-2 py-0.5 bg-accent/10 w-fit rounded border border-accent/20">Target: {data.run_a.summary.target}</p>
          </div>
          
          {renderStats(data.run_a)}
          
          <div className="h-[300px]">
            <ProviderRadarChart providers={data.run_a.providers} />
          </div>
          <div className="h-[350px]">
            <CategoryBarChart categories={data.run_a.categories} />
          </div>
        </div>

        {/* Vertical divider on lg */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -ml-px bg-border/50" />

        {/* Column B */}
        <div className="space-y-6 flex flex-col">
          <div className="border border-border bg-card p-4 rounded-md shadow-sm">
            <Badge className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/20 mb-2">Comparison</Badge>
            <h2 className="text-xl font-bold font-mono text-foreground">{data.run_b.name}</h2>
            <p className="text-sm text-accent mt-1 mr-2 px-2 py-0.5 bg-accent/10 w-fit rounded border border-accent/20">Target: {data.run_b.summary.target}</p>
          </div>
          
          {renderStats(data.run_b)}
          
          <div className="h-[300px]">
            <ProviderRadarChart providers={data.run_b.providers} />
          </div>
          <div className="h-[350px]">
            <CategoryBarChart categories={data.run_b.categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
