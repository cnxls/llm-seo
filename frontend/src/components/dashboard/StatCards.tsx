import { Card, CardContent } from '../ui/card';
import { RunSummary, ProvidersData } from '../../types';

export default function StatCards({ summary, providers }: { summary: RunSummary, providers: ProvidersData }) {
  const targetBrand = summary.brands.find(b => b.is_target);
  const winRate = targetBrand && summary.total_queries > 0 
    ? Math.round((targetBrand.wins / (summary.total_queries * providers.providers.length)) * 100) 
    : 0;

  const stats = [
    { label: 'Total Queries', value: summary.total_queries },
    { label: 'Brands Tracked', value: summary.brands.length },
    { label: 'Target Win Rate', value: `${winRate}%` },
    { label: 'Active Providers', value: providers.providers.length }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card key={stat.label} className="border border-border border-l-[3px] border-l-accent bg-card shadow-md">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
