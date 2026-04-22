import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { RunSummary } from '../../types';

export default function BrandRankingTable({ summary }: { summary: RunSummary }) {
  const sortedBrands = [...summary.brands].sort((a, b) => b.mentions - a.mentions);
  const maxMentions = Math.max(...sortedBrands.map(b => b.mentions), 1);

  return (
    <div className="border border-border rounded-md bg-card shadow-md overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border">
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead className="w-1/3">Mentions</TableHead>
            <TableHead className="text-right">Found In</TableHead>
            <TableHead className="text-right">Avg Score</TableHead>
            <TableHead className="text-right">Wins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBrands.map((brand, idx) => {
            const isTarget = brand.is_target;
            const barWidth = `${(brand.mentions / maxMentions) * 100}%`;

            return (
              <TableRow 
                key={brand.brand} 
                className={`border-border ${isTarget ? 'bg-accent/10 hover:bg-accent/20' : 'hover:bg-muted/30'}`}
              >
                <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className={isTarget ? 'text-accent font-bold' : 'font-medium text-foreground'}>
                  {brand.brand}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-right shrink-0 font-medium text-foreground">{brand.mentions}</span>
                    <div className="flex-1 h-1.5 bg-accent/20 rounded-sm overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-sm" 
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{brand.found_in}</TableCell>
                <TableCell className="text-right font-medium">{brand.avg_score.toFixed(1)}</TableCell>
                <TableCell className="text-right font-medium">{brand.wins}</TableCell>
              </TableRow>
            );
          })}
          {sortedBrands.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No brand data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
