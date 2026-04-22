import { useState, useMemo, Fragment } from 'react';
import { QueryData } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, MessageSquareQuote } from 'lucide-react';
import LLMResponseModal from './LLMResponseModal';

interface QueryDetailsTableProps {
  queries: QueryData[];
  runName: string;
}

export default function QueryDetailsTable({ queries, runName }: QueryDetailsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalQueryId, setModalQueryId] = useState<number | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(queries.map(q => q.category));
    return ['all', ...Array.from(cats)].sort();
  }, [queries]);

  const filteredQueries = useMemo(() => {
    if (selectedCategory === 'all') return queries;
    return queries.filter(q => q.category === selectedCategory);
  }, [queries, selectedCategory]);

  const allProviders = useMemo(() => {
    const providers = new Set<string>();
    queries.forEach(q => {
      Object.keys(q.providers).forEach(p => providers.add(p));
    });
    return Array.from(providers).sort();
  }, [queries]);

  const toggleRow = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[250px] bg-card border-border">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground mr-1">
          Showing {filteredQueries.length} of {queries.length} queries
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden shadow-md bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-[45%]">Query</TableHead>
              <TableHead className="w-[15%]">Category</TableHead>
              <TableHead>Winners</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueries.map(query => {
              const qs = query.question || "Unknown query";
              const isExpanded = expandedId === query.question_id;

              return (
                <Fragment key={query.question_id}>
                  <TableRow 
                    className="cursor-pointer border-border hover:bg-muted/30 transition-colors"
                    onClick={() => toggleRow(query.question_id)}
                  >
                    <TableCell className="w-10 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="truncate max-w-[500px]" title={qs}>
                        {qs.length > 80 ? qs.substring(0, 80) + '...' : qs}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border-border hover:bg-muted">
                        {query.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {allProviders.map(p => {
                          const pData = query.providers[p];
                          if (!pData) return null;
                          
                          const winnerBrandName = pData.winner;
                          const winnerBrand = pData.brands.find(b => b.brand === winnerBrandName);
                          // Only valid win if count > 0
                          const hasValidWinner = winnerBrand && winnerBrand.count > 0;
                          
                          let badgeClass = "bg-muted text-muted-foreground border-border hover:bg-muted font-normal";
                          let displayLabel = `${p}: Tie/None`;
                          
                          if (hasValidWinner) {
                            if (winnerBrand.is_target) {
                              badgeClass = "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
                            } else {
                              badgeClass = "bg-muted/50 text-muted-foreground border-border/80 hover:bg-muted/80";
                            }
                            displayLabel = `${p}: ${winnerBrandName}`;
                          }

                          return (
                            <Badge key={p} variant="outline" className={badgeClass}>
                              {displayLabel}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow className="bg-surface/50 border-border">
                      <TableCell colSpan={4} className="p-0 border-b border-border">
                        <div className="p-6 border-l-[3px] border-l-accent ml-[1px]">
                          <div className="mb-6 flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-tight">Full Query</h4>
                              <p className="text-foreground bg-black/20 p-4 rounded-md border border-border/50 break-words font-medium">
                                {qs}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={(e: any) => { e.stopPropagation(); setModalQueryId(query.question_id); }}
                              className="shrink-0 group hover:border-accent hover:text-accent transition-all duration-200"
                            >
                              <MessageSquareQuote className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200 text-muted-foreground group-hover:text-accent" />
                              View Responses
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allProviders.map(p => {
                              const pData = query.providers[p];
                              if (!pData) return null;
                              
                              return (
                                <div key={p} className="bg-card border border-border rounded-md shadow-sm overflow-hidden flex flex-col">
                                  <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                                    <span className="font-semibold capitalize text-foreground">{p}</span>
                                  </div>
                                  <div className="p-0 flex-1">
                                    {pData.brands.length === 0 ? (
                                      <div className="text-sm text-muted-foreground p-4 text-center italic">No brands found</div>
                                    ) : (
                                      <ul className="divide-y divide-border">
                                        {[...pData.brands].sort((a, b) => b.count - a.count).map(b => (
                                          <li key={b.brand} className="px-4 py-3 flex items-center justify-between group hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                              <div className={`w-2 h-2 rounded-full ${b.found ? (b.is_target ? 'bg-accent shadow-[0_0_8px_currentColor]' : 'bg-muted-foreground') : 'bg-border'}`} />
                                              <span className={`text-sm font-medium ${b.is_target ? 'text-accent' : 'text-foreground'}`}>
                                                {b.brand}
                                              </span>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                              <span className="text-xs font-mono bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground mr-1" title="Sentiment Score">
                                                {b.score.toFixed(1)}
                                              </span>
                                              <span className="text-sm font-semibold w-6 text-right tabular-nums text-foreground">{b.count}</span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            
            {filteredQueries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No queries match the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <LLMResponseModal 
        runName={runName} 
        queryId={modalQueryId} 
        isOpen={modalQueryId !== null} 
        onClose={() => setModalQueryId(null)} 
      />
    </div>
  );
}
