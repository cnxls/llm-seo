import { useState } from 'react';
import { ConfigItem } from '../../types';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, Trash2 } from 'lucide-react';

interface ConfigManagerProps {
  configs: ConfigItem[];
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}

export default function ConfigManager({ configs, onLoad, onDelete }: ConfigManagerProps) {
  const [selected, setSelected] = useState<string>('');

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Saved Configurations</h2>
        <p className="text-sm text-muted-foreground">Configs are created when you onboard a new brand. Load a previous one or delete old ones.</p>
      </div>

      <div className="p-4 bg-muted/20 border border-border rounded-md">
        <label className="text-sm font-medium text-foreground block mb-3">Load Existing Config</label>
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
    </section>
  );
}
