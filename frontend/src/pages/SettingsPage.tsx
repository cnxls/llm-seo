import { useState, useEffect } from 'react';
import { api } from '../api';
import { BrandsConfig, TemplatesConfig, ConfigItem } from '../types';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import ConfigManager from '../components/settings/ConfigManager';
import BrandEditor from '../components/settings/BrandEditor';
import CompetitorEditor from '../components/settings/CompetitorEditor';
import TemplateEditor from '../components/settings/TemplateEditor';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const brandsSchema = z.object({
  target: z.string().min(1, "Target brand name is required"),
  target_aliases: z.array(z.string()),
  competitors: z.array(z.string()),
  competitor_aliases: z.record(z.string(), z.array(z.string()))
});

type BrandsFormValues = z.infer<typeof brandsSchema>;

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  
  const { watch, reset, handleSubmit, formState: { errors } } = useForm<BrandsFormValues>({
    resolver: zodResolver(brandsSchema),
    defaultValues: {
      target: '', target_aliases: [], competitors: [], competitor_aliases: {}
    }
  });

  const brands = watch();

  const [templates, setTemplates] = useState<TemplatesConfig>({
    templates: {}
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
    loadCurrent();
  }, []);

  const fetchConfigs = async () => {
    try {
      const resp = await api.getConfigs();
      setConfigs(resp);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCurrent = async () => {
    setLoading(true);
    try {
      const [brandData, templateData] = await Promise.all([
        api.getBrands(),
        api.getTemplates()
      ]);
      reset(brandData);
      setTemplates(templateData);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConfig = async (name: string) => {
    setLoading(true);
    try {
      const full = await api.getConfig(name);
      reset(full.brands);
      setTemplates(full.templates);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (name: string) => {
    try {
      await api.deleteConfig(name);
      await fetchConfigs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAll = handleSubmit(async (data) => {
    setSaving(true);
    setError(null);
    try {
      await api.updateBrands(data as BrandsConfig);
      await api.updateTemplates(templates);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  });

  if (loading && !brands.target) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Settings</h1>
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-md flex items-center mb-6">
          <AlertCircle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-md flex items-center mb-6">
          <AlertCircle className="w-5 h-5 mr-3" />
          <div className="flex flex-col">
            <span className="font-semibold">Validation Error</span>
            <ul className="list-disc ml-5 mt-1 text-sm">
              {errors.target && <li>{errors.target.message}</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-10 bg-card border border-border rounded-md shadow-md p-8">
        <ConfigManager
          configs={configs}
          onLoad={handleLoadConfig}
          onDelete={handleDeleteConfig}
        />

        <Separator className="bg-border" />

        <BrandEditor 
          brands={brands as BrandsConfig}
          onChange={(b) => reset(b)}
        />

        <Separator className="bg-border" />

        <CompetitorEditor
          brands={brands as BrandsConfig}
          onChange={(b) => reset(b)}
        />

        <Separator className="bg-border" />

        <TemplateEditor
          templates={templates}
          onChange={(t) => setTemplates(t)}
        />
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <Button 
          size="lg" 
          className="bg-accent hover:bg-accent/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] text-white font-medium px-8 h-12 rounded-full"
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
