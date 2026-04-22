import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ProvidersData } from '../../types';
import { Card, CardContent } from '../ui/card';

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#6366f1',
  anthropic: '#f97316',
  google: '#22d3ee',
  default: '#94a3b8'
};

export default function ProviderRadarChart({ providers }: { providers: ProvidersData }) {
  if (!providers || !providers.providers.length) {
    return (
      <Card className="h-full border-border bg-card shadow-md flex items-center justify-center text-muted-foreground">
        No provider data available.
      </Card>
    );
  }

  const data: any[] = [
    { metric: 'Mentions' },
    { metric: 'Found In' },
    { metric: 'Avg Score (x100)' },
    { metric: 'Wins' }
  ];

  providers.providers.forEach((provider, idx) => {
    data[0][provider as keyof typeof data[0]] = providers.mentions[idx];
    data[1][provider as keyof typeof data[1]] = providers.found_in[idx];
    data[2][provider as keyof typeof data[2]] = providers.avg_scores[idx] * 100; // Scaled for radar
    data[3][provider as keyof typeof data[3]] = providers.wins[idx];
  });

  return (
    <Card className="h-full border-border bg-card shadow-md">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '6px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: '10px' }} />
              
              {providers.providers.map((p) => (
                <Radar
                  key={p}
                  name={p.charAt(0).toUpperCase() + p.slice(1)}
                  dataKey={p}
                  stroke={PROVIDER_COLORS[p.toLowerCase()] || PROVIDER_COLORS.default}
                  fill={PROVIDER_COLORS[p.toLowerCase()] || PROVIDER_COLORS.default}
                  fillOpacity={0.3}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
