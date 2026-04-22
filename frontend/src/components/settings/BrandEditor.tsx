import { BrandsConfig } from '../../types';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';

interface BrandEditorProps {
  brands: BrandsConfig;
  onChange: (brands: BrandsConfig) => void;
}

export default function BrandEditor({ brands, onChange }: BrandEditorProps) {
  const handleAddAlias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !brands.target_aliases.includes(val)) {
        onChange({ ...brands, target_aliases: [...brands.target_aliases, val] });
        e.currentTarget.value = '';
      }
    }
  };

  const handleRemoveAlias = (alias: string) => {
    onChange({
      ...brands,
      target_aliases: brands.target_aliases.filter(a => a !== alias)
    });
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Target Brand</h2>
        <p className="text-sm text-muted-foreground">The primary brand you are tracking the performance of.</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Brand Name</label>
          <input 
            type="text" 
            className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            placeholder="e.g. Acme Corp"
            value={brands.target}
            onChange={(e) => onChange({ ...brands, target: e.target.value })}
          />
        </div>

        <div className="space-y-3 p-4 bg-muted/10 border border-border rounded-md">
          <label className="text-sm font-medium text-foreground">Aliases</label>
          
          {brands.target_aliases.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {brands.target_aliases.map(alias => (
                <Badge key={alias} variant="secondary" className="pl-3 pr-1 py-1 bg-surface border-border hover:bg-surface-hover group">
                  {alias}
                  <button 
                    onClick={() => handleRemoveAlias(alias)}
                    className="ml-2 rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground group-hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <input 
            type="text" 
            className="w-full h-9 rounded-md border border-border/50 bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50"
            placeholder="Add alias, press Enter..."
            onKeyDown={handleAddAlias}
          />
        </div>
      </div>
    </section>
  );
}
