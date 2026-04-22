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

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  
  const [brands, setBrands] = useState<BrandsConfig>({
    target: '', target_aliases: [], competitors: [], competitor_aliases: {}
  });

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
      setBrands(brandData);
      setTemplates(templateData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConfig = async (name: string) => {
    setLoading(true);
    try {
      const full = await api.getConfig(name);
      setBrands(full.brands);
      setTemplates(full.templates);
    } catch (e: any) {
      setError(e.message);
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

  const handleCreateConfig = async (name: string) => {
    try {
      await api.createConfig({ name, brands, templates });
      await fetchConfigs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await api.updateBrands(brands);
      await api.updateTemplates(templates);
      // Success flash could go here
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

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

      <div className="space-y-10 bg-card border border-border rounded-md shadow-md p-8">
        <ConfigManager 
          configs={configs}
          onLoad={handleLoadConfig}
          onDelete={handleDeleteConfig}
          onSave={handleCreateConfig}
        />

        <Separator className="bg-border" />

        <BrandEditor 
          brands={brands}
          onChange={(b) => setBrands(b)}
        />

        <Separator className="bg-border" />

        <CompetitorEditor
          brands={brands}
          onChange={(b) => setBrands(b)}
        />

        <Separator className="bg-border" />

        <TemplateEditor
          templates={templates}
          onChange={(t) => setTemplates(t)}
        />
      </div>

      {/* Floating Save Button */}
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
