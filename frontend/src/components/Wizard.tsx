import { useState, useEffect } from 'react';
import { Target, Play, TrendingUp, X, Check, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '../api';
import AppLogo from './layout/AppLogo';
import { OnboardConfig, BrandsConfig } from '../types';

interface WizardProps {
  initialBrand: string;
  onClose: () => void;
  onComplete: () => void;
}

const SCAN_PHASES = [
  "Identifying category…",
  "Picking up keywords…",
  "Scanning competitors…",
  "Detecting use cases…",
  "Composing your config…",
];

export default function Wizard({ initialBrand, onClose, onComplete }: WizardProps) {
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState(initialBrand || '');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState(0);
  const [config, setConfig] = useState<OnboardConfig | null>(null);

  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState('');
  const [useCases, setUseCases] = useState<string[]>([]);
  const [useCaseInput, setUseCaseInput] = useState('');

  const steps = [
    { title: "Welcome" },
    { title: "Your brand" },
    { title: "Generating" },
    { title: "Review" },
    { title: "Ready" },
  ];

  // Cycle scan phases while generating
  useEffect(() => {
    if (!generating) return;
    setScanPhase(0);
    const id = setInterval(() => {
      setScanPhase(p => Math.min(p + 1, SCAN_PHASES.length - 1));
    }, 1800);
    return () => clearInterval(id);
  }, [generating]);

  const handleGenerate = async () => {
    setStep(2);
    setGenerating(true);
    setGenError(null);
    try {
      const result = await api.onboard({
        brand_name: brand.trim(),
        description: description.trim(),
        language: language.trim() || 'English',
      });
      setConfig(result);
      setCompetitors(result.competitors.map(c => c.name));
      setUseCases(result.placeholders.use_cases);
      setGenerating(false);
      setStep(3);
    } catch (e: any) {
      setGenerating(false);
      setGenError(e instanceof Error ? e.message : 'Failed to generate config');
    }
  };

  const handleFinalize = async () => {
    if (!config) { onClose(); onComplete(); return; }

    const updatedBrands: BrandsConfig = {
      target: brand,
      target_aliases: [brand, ...aliases].filter((v, i, a) => a.indexOf(v) === i),
      competitors,
      competitor_aliases: Object.fromEntries(competitors.map(c => {
        const existing = config.competitors.find(x => x.name === c);
        return [c, existing ? existing.aliases : [c]];
      })),
    };

    try {
      await api.updateBrands(updatedBrands);
    } catch (e) {
      console.error(e);
    }
    onClose();
    onComplete();
  };

  const next = () => {
    if (step === 1) {
      if (!brand.trim() || !description.trim()) return;
      handleGenerate();
      return;
    }
    setStep(s => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const addItem = (e: React.KeyboardEvent<HTMLInputElement>, value: string, list: string[], setter: (v: string[]) => void, clear: () => void) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      if (!list.includes(value.trim())) setter([...list, value.trim()]);
      clear();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overscroll-contain animate-fade-in-up">
      <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded-md mb-2 inline-block">
              Step {step + 1} of {steps.length}
            </span>
            <h2 className="text-xl font-bold text-foreground">
              {step === 0 && "Welcome to LLM SEO Monitor"}
              {step === 1 && "Tell us about your brand"}
              {step === 2 && "Working on your config…"}
              {step === 3 && "Review what we generated"}
              {step === 4 && "You're all set!"}
            </h2>
          </div>
          {step !== 2 && (
            <button className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-lg transition-colors" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-muted">

          {step === 0 && (
            <div className="space-y-6">
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                This tool tracks how often LLMs like ChatGPT, Claude, and Gemini mention <strong className="text-foreground">your brand</strong> when
                users ask questions about your category — a kind of SEO, but for AI answers.
              </p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Target, title: "You set up", desc: "your brand and a short description." },
                  { icon: Sparkles, title: "AI fills in", desc: "competitors, category, and use cases." },
                  { icon: TrendingUp, title: "You learn", desc: "where your brand stands across LLMs." },
                ].map((s, i) => {
                  const IconComp = s.icon;
                  return (
                    <div key={i} className="bg-accent/10 rounded-xl p-4 text-center border border-accent/20">
                      <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-3 shadow-md">
                        <IconComp size={20} />
                      </div>
                      <div className="font-semibold text-sm text-foreground mb-1">{s.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground pt-4 border-t border-border mt-6">
                Takes about 1 minute. You can edit anything afterwards in Settings.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                We'll use this to ask an AI for sensible defaults — competitors, category, use cases.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Brand name</label>
                <input
                  placeholder="e.g. Obsidian"
                  autoFocus
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  What do they do?
                  <span className="block text-xs text-muted-foreground font-normal mt-1">
                    One short sentence is enough. The more specific, the better the AI suggestions.
                  </span>
                </label>
                <textarea
                  placeholder="e.g. A local-first markdown note-taking app for power users"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Output language</label>
                <input
                  placeholder="e.g. English, Ukrainian, French"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium text-foreground">
                  Other spellings (optional)
                  <span className="block text-xs text-muted-foreground font-normal mt-1">
                    Domains, abbreviations, alternate names — any way someone might write your brand.
                  </span>
                </label>

                <div className="flex flex-wrap gap-2 mb-2">
                  {aliases.map((a, i) => (
                    <span key={i} className="bg-accent/15 text-accent border border-accent/30 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
                      {a}
                      <X size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setAliases(aliases.filter((_, x) => x !== i))}/>
                    </span>
                  ))}
                </div>

                <input
                  placeholder="Type an alias and press Enter"
                  value={aliasInput}
                  onChange={e => setAliasInput(e.target.value)}
                  onKeyDown={e => addItem(e, aliasInput, aliases, setAliases, () => setAliasInput(''))}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-6 flex flex-col items-center justify-center text-center min-h-[420px] relative wizard-scan">
              {/* Scan glow ambient */}
              <div className="wizard-scan-glow" />

              {/* Logo at center with scanning ring */}
              <div className="relative w-44 h-44 mb-8">
                <AppLogo className="w-full h-full rounded-[28px] relative z-10" animated />
                {/* Outer scanning sweep */}
                <div className="absolute inset-0 wizard-scan-sweep rounded-[28px]" />
                {/* Orbiting dots */}
                <div className="absolute inset-0 wizard-orbit">
                  <div className="wizard-orbit-dot" style={{ animationDelay: '0s' }} />
                  <div className="wizard-orbit-dot" style={{ animationDelay: '-1.5s' }} />
                  <div className="wizard-orbit-dot" style={{ animationDelay: '-3s' }} />
                </div>
              </div>

              {/* Phase text */}
              <div className="h-7 mb-6 relative w-full max-w-sm">
                {SCAN_PHASES.map((phrase, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 text-sm font-medium text-foreground transition-all duration-500 ease-out
                      ${i === scanPhase ? 'opacity-100 translate-y-0' : i < scanPhase ? 'opacity-0 -translate-y-2' : 'opacity-0 translate-y-2'}`}
                  >
                    {phrase}
                  </div>
                ))}
              </div>

              {/* Floating discovery pills */}
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SCAN_PHASES.slice(0, scanPhase + 1).map((_, i) => (
                  <span
                    key={i}
                    className="wizard-pill bg-accent/10 text-accent border border-accent/30 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {['category', 'keywords', 'competitors', 'use cases', 'config'][i]} ✓
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-8 max-w-xs">
                Asking an AI to study <strong className="text-foreground">{brand}</strong> and suggest a useful config. This usually takes 5–15 seconds.
              </p>

              {genError && (
                <div className="mt-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" /> {genError}
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => { setStep(1); setGenError(null); }}>Back</Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && config && (
            <div className="space-y-6">
              <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We identified <strong className="text-foreground">{config.placeholders.category}</strong> as your category. Tweak anything below — you can also edit later in Settings.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  Competitors
                  <span className="text-xs text-muted-foreground font-normal">{competitors.length} selected</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {competitors.map((c, i) => (
                    <span key={i} className="bg-accent/15 text-accent border border-accent/30 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
                      {c}
                      <X size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setCompetitors(competitors.filter((_, x) => x !== i))}/>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Add another competitor and press Enter"
                  value={competitorInput}
                  onChange={e => setCompetitorInput(e.target.value)}
                  onKeyDown={e => addItem(e, competitorInput, competitors, setCompetitors, () => setCompetitorInput(''))}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  Use cases
                  <span className="text-xs text-muted-foreground font-normal">drives query variation</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {useCases.map((u, i) => (
                    <span key={i} className="bg-muted text-foreground border border-border px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
                      {u}
                      <X size={12} className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => setUseCases(useCases.filter((_, x) => x !== i))}/>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Add a use case and press Enter"
                  value={useCaseInput}
                  onChange={e => setUseCaseInput(e.target.value)}
                  onKeyDown={e => addItem(e, useCaseInput, useCases, setUseCases, () => setUseCaseInput(''))}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-muted/30 rounded-lg p-3 text-center border border-border">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Category</div>
                  <div className="text-sm font-semibold text-foreground truncate" title={config.placeholders.category}>{config.placeholders.category}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center border border-border">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Noun</div>
                  <div className="text-sm font-semibold text-foreground truncate" title={config.placeholders.category_noun}>{config.placeholders.category_noun}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center border border-border">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Language</div>
                  <div className="text-sm font-semibold text-foreground truncate" title={config.language}>{config.language}</div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Check size={32} className="text-accent" strokeWidth={3} />
              </div>
              <p className="text-lg text-foreground max-w-sm mb-4 leading-relaxed">
                Ready to track <strong className="font-bold">{brand}</strong> against <strong className="font-bold">{competitors.length}</strong> competitors
                {config?.placeholders.category && <> across <strong className="font-bold">{config.placeholders.category}</strong> queries</>}.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll land on your Dashboard. Trigger a new Run anytime!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/40 border-t border-border flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-6 bg-accent" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {step > 0 && step !== 2 && step !== 4 && (
              <Button variant="outline" onClick={prev}>Back</Button>
            )}
            {step === 0 && (
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={next}>
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 1 && (
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={next}
                disabled={!brand.trim() || !description.trim()}
              >
                Generate <Sparkles size={16} className="ml-2" />
              </Button>
            )}
            {step === 3 && (
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setStep(4)}>
                Looks good <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 4 && (
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleFinalize}>
                Go to Dashboard <Play size={16} className="ml-2 fill-current" />
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
