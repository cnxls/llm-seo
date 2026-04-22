import { useMemo, useState } from 'react';
import { PreviewQuery } from '../../types';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface QueryPreviewListProps {
  queries: PreviewQuery[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

export default function QueryPreviewList({ queries, selectedIds, onSelectionChange }: QueryPreviewListProps) {
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(queries.map(q => q.category))).sort()];
  }, [queries]);

  const filteredQueries = useMemo(() => {
    if (categoryFilter === 'all') return queries;
    return queries.filter(q => q.category === categoryFilter);
  }, [queries, categoryFilter]);

  const handleSelectAll = () => {
    const newSet = new Set(selectedIds);
    filteredQueries.forEach(q => newSet.add(q.id));
    onSelectionChange(newSet);
  };

  const handleClear = () => {
    const newSet = new Set(selectedIds);
    filteredQueries.forEach(q => newSet.delete(q.id));
    onSelectionChange(newSet);
  };

  const toggleOne = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    onSelectionChange(newSet);
  };

  return (
    <div className="bg-card border border-border shadow-md rounded-md overflow-hidden flex flex-col h-[700px]">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleSelectAll}>Select All</Button>
          <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            <span className="text-foreground">{selectedIds.size}</span> selected
          </span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {filteredQueries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground italic">
            No queries found.
          </div>
        ) : (
          <ul className="space-y-1">
            {filteredQueries.map(q => (
              <li 
                key={q.id} 
                className="flex items-start gap-4 p-3 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0 rounded-sm cursor-pointer"
                onClick={() => toggleOne(q.id)}
              >
                <div className="pt-1">
                  <Checkbox 
                    checked={selectedIds.has(q.id)} 
                    onCheckedChange={() => toggleOne(q.id)}
                    className="border-muted-foreground"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm leading-tight mb-1.5 break-words">
                    {q.query || 'Unknown query'}
                  </p>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {q.category}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
