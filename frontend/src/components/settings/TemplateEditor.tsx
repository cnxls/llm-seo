import { useState } from 'react';
import { TemplatesConfig } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface TemplateEditorProps {
  templates: TemplatesConfig;
  onChange: (t: TemplatesConfig) => void;
}

export default function TemplateEditor({ templates, onChange }: TemplateEditorProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(Object.keys(templates.templates).slice(0, 1)));

  const toggleCat = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCats(next);
  };

  const handleAddCategory = () => {
    const baseName = 'New Category';
    let newName = baseName;
    let i = 1;
    while (templates.templates[newName]) {
      newName = `${baseName} ${i++}`;
    }
    onChange({
      ...templates,
      templates: { ...templates.templates, [newName]: [] }
    });
    const nextExp = new Set(expandedCats);
    nextExp.add(newName);
    setExpandedCats(nextExp);
  };

  const handleRemoveCategory = (cat: string) => {
    const next = { ...templates.templates };
    delete next[cat];
    onChange({ ...templates, templates: next });
  };

  const handleUpdateCategoryName = (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim() || templates.templates[newName]) return;
    const next = { ...templates.templates };
    next[newName] = next[oldName];
    delete next[oldName];
    onChange({ ...templates, templates: next });

    const nextExp = new Set(expandedCats);
    if (nextExp.has(oldName)) {
      nextExp.delete(oldName);
      nextExp.add(newName);
    }
    setExpandedCats(nextExp);
  };

  const handleUpdateTemplates = (cat: string, value: string) => {
    const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
    onChange({
      ...templates,
      templates: { ...templates.templates, [cat]: lines }
    });
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Query Templates</h2>
          <p className="text-sm text-muted-foreground">Define the string templates for generating queries by category.</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(templates.templates).map(cat => {
          const isExpanded = expandedCats.has(cat);
          const tmpls = templates.templates[cat] || [];

          return (
            <div key={cat} className="border border-border rounded-md bg-card overflow-hidden transition-colors shadow-sm">
              <div 
                className="flex items-center px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 border-b border-border/0 data-[expanded=true]:border-border/50"
                data-expanded={isExpanded}
                onClick={() => toggleCat(cat)}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 mr-3 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 mr-3 text-muted-foreground" />}
                <span className="font-semibold flex-1 text-foreground">{cat}</span>
                <Badge variant="outline" className="bg-background mr-4">
                  {tmpls.length} tmpls
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  onClick={(e: any) => { e.stopPropagation(); handleRemoveCategory(cat); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-background">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Category Name</label>
                    <input 
                      type="text" 
                      className="w-full max-w-sm h-9 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      defaultValue={cat}
                      onBlur={(e) => handleUpdateCategoryName(cat, e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-sm font-medium text-foreground">Templates (one per line)</label>
                      <span className="text-xs text-muted-foreground font-mono">
                        Available placeholders: {Array.isArray(templates.placeholders) 
                          ? templates.placeholders.join(', ') 
                          : templates.placeholders ? Object.keys(templates.placeholders).map(k => `{${k}}`).join(', ') : '{brand}'}
                      </span>
                    </div>
                    <textarea 
                      className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent font-mono custom-scrollbar"
                      placeholder="e.g. What is the best tool for {brand}?"
                      defaultValue={tmpls.join('\n')}
                      onBlur={(e) => handleUpdateTemplates(cat, e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button variant="outline" className="w-full border-dashed border-border text-foreground hover:bg-muted/50 hover:text-foreground mt-2" onClick={handleAddCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>
    </section>
  );
}
