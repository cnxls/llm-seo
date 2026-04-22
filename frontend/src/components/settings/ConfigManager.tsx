import { useState } from 'react';
import { ConfigItem } from '../../types';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Save, Download, Trash2 } from 'lucide-react';

interface ConfigManagerProps {
  configs: ConfigItem[];
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onSave: (name: string) => void;
}

export default function ConfigManager({ configs, onLoad, onDelete, onSave }: ConfigManagerProps) {
  const [selected, setSelected] = useState<string>('');
  const [newName, setNewName] = useState<string>('');

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Saved Configurations</h2>
        <p className="text-sm text-muted-foreground">Load or save your current brand and template setup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-md">
          <label className="text-sm font-medium text-foreground block">Load Existing Config</label>
          <div className="flex gap-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="flex-1 bg-background">
                <SelectValue placeholder="Select a config to load" />
              </SelectTrigger>
              <SelectContent>
                {configs.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={() => selected && onLoad(selected)} disabled={!selected}>
              <Download className="w-4 h-4 mr-2" /> Load
            </Button>
            <Button variant="outline" className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10" onClick={() => selected && onDelete(selected)} disabled={!selected}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-md">
          <label className="text-sm font-medium text-foreground block">Save Current Config As</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 h-9 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              placeholder="e.g. Acme Q3 Analysis"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button className="bg-accent hover:bg-accent/90 shrink-0" onClick={() => { if(newName) { onSave(newName); setNewName(''); } }} disabled={!newName}>
              <Save className="w-4 h-4 mr-2" /> Save As
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
