import { BrandsConfig } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { X, Plus, Trash2 } from 'lucide-react';

interface CompetitorEditorProps {
  brands: BrandsConfig;
  onChange: (brands: BrandsConfig) => void;
}

export default function CompetitorEditor({ brands, onChange }: CompetitorEditorProps) {
  const handleAddCompetitor = () => {
    const newName = `Competitor ${brands.competitors.length + 1}`;
    onChange({
      ...brands,
      competitors: [...brands.competitors, newName],
      competitor_aliases: { ...brands.competitor_aliases, [newName]: [] }
    });
  };

  const handleRemoveCompetitor = (comp: string) => {
    const newComp = brands.competitors.filter(c => c !== comp);
    const newAliases = { ...brands.competitor_aliases };
    delete newAliases[comp];
    onChange({ ...brands, competitors: newComp, competitor_aliases: newAliases });
  };

  const handleUpdateName = (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;
    
    // Check if new name exists
    if (brands.competitors.includes(newName)) return;

    const newComp = brands.competitors.map(c => c === oldName ? newName : c);
    const newAliases = { ...brands.competitor_aliases };
    newAliases[newName] = newAliases[oldName] || [];
    delete newAliases[oldName];

    onChange({ ...brands, competitors: newComp, competitor_aliases: newAliases });
  };

  const handleAddAlias = (comp: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      const current = brands.competitor_aliases[comp] || [];
      if (val && !current.includes(val)) {
        onChange({
          ...brands,
          competitor_aliases: { ...brands.competitor_aliases, [comp]: [...current, val] }
        });
        e.currentTarget.value = '';
      }
    }
  };

  const handleRemoveAlias = (comp: string, alias: string) => {
    const current = brands.competitor_aliases[comp] || [];
    onChange({
      ...brands,
      competitor_aliases: { ...brands.competitor_aliases, [comp]: current.filter(a => a !== alias) }
    });
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Competitors</h2>
        <p className="text-sm text-muted-foreground">Brands to compare performance against.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.competitors.map(comp => (
          <Card key={comp} className="border border-border bg-card shadow-sm pt-4 relative group">
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveCompetitor(comp)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  defaultValue={comp}
                  onBlur={(e) => handleUpdateName(comp, e.target.value)}
                />
              </div>

              <div className="space-y-2 p-3 bg-muted/10 border border-border rounded-md">
                <label className="text-xs font-medium text-foreground">Aliases</label>
                
                {(brands.competitor_aliases[comp] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(brands.competitor_aliases[comp] || []).map(alias => (
                      <Badge key={alias} variant="secondary" className="pl-2 pr-1 py-0.5 text-xs bg-surface border-border">
                        {alias}
                        <button 
                          onClick={() => handleRemoveAlias(comp, alias)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <input 
                  type="text" 
                  className="w-full h-8 rounded-md border border-border/50 bg-background px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50"
                  placeholder="Add alias..."
                  onKeyDown={(e) => handleAddAlias(comp, e)}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <button 
          onClick={handleAddCompetitor}
          className="border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-accent transition-colors min-h-[220px]"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-medium">Add Competitor</span>
        </button>
      </div>
    </section>
  );
}
