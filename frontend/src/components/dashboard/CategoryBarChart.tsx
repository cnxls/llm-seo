import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CategoriesData } from '../../types';
import { Card, CardContent } from '../ui/card';

export default function CategoryBarChart({ categories }: { categories: CategoriesData }) {
  if (!categories || !categories.categories.length) {
    return (
      <Card className="h-full border-border bg-card shadow-md flex items-center justify-center text-muted-foreground">
        No category data available.
      </Card>
    );
  }

  const data = categories.categories.map((cat, idx) => ({
    name: cat,
    winRate: Math.round(categories.win_rates[idx] * 100),
    wins: categories.target_wins[idx],
    total: categories.total_queries[idx],
  }));

  const getFillColor = (winRate: number) => {
    if (winRate >= 60) return '#618556'; // Muted olive green
    if (winRate >= 40) return '#9e8155'; // Muted earthy amber
    return '#a15d5d'; // Muted earthy red
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border p-3 rounded-md shadow-lg text-sm text-foreground">
          <p className="font-semibold mb-1 text-primary">{data.name}</p>
          <p>{`${data.winRate}% (${data.wins} wins / ${data.total} queries)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full border-border bg-card shadow-md">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8' }} stroke="#334155" />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                width={100} 
                stroke="#334155"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getFillColor(entry.winRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
