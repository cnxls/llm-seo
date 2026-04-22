import { useState } from 'react';
import { Target, Play, TrendingUp, X, Check, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '../api';

interface WizardProps {
  initialBrand: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function Wizard({ initialBrand, onClose, onComplete }: WizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    brand: initialBrand || "",
    aliases: [] as string[],
    competitors: [] as string[],
    category: "",
    useCases: [] as string[],
  });

  const [aliasInput, setAliasInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [useCaseInput, setUseCaseInput] = useState("");

  const steps = [
    { title: "Welcome", key: "welcome" },
    { title: "Your brand", key: "brand" },
    { title: "Competitors", key: "competitors" },
    { title: "Questions", key: "templates" },
    { title: "Ready", key: "ready" },
  ];

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const competitorSuggestions = [
    { name: "Notion", reason: "Frequently mentioned alongside Obsidian in rankings" },
    { name: "Roam Research", reason: "Direct PKM competitor" },
    { name: "Logseq", reason: "Open-source alternative, same audience" },
    { name: "Craft", reason: "Premium note-taking competitor" },
    { name: "Bear", reason: "Markdown-focused Apple ecosystem alternative" },
  ];

  const handleAddAlias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && aliasInput.trim()) {
      e.preventDefault();
      setForm({ ...form, aliases: [...form.aliases, aliasInput.trim()] });
      setAliasInput("");
    }
  };

  const handleAddCompetitor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && competitorInput.trim()) {
      e.preventDefault();
      setForm({ ...form, competitors: [...form.competitors, competitorInput.trim()] });
      setCompetitorInput("");
    }
  };

  const handleAddUseCase = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && useCaseInput.trim()) {
      e.preventDefault();
      setForm({ ...form, useCases: [...form.useCases, useCaseInput.trim()] });
      setUseCaseInput("");
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
              {step === 1 && "What brand are you tracking?"}
              {step === 2 && "Who are your competitors?"}
              {step === 3 && "What questions should we ask?"}
              {step === 4 && "You're all set!"}
            </h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-lg transition-colors" onClick={onClose}>
            <X size={18} />
          </button>
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
                  { icon: Target, title: "You set up", desc: "your brand, competitors, and the questions people ask." },
                  { icon: Play, title: "We ask", desc: "3 LLMs your questions and collect their full answers." },
                  { icon: TrendingUp, title: "You learn", desc: "which brands get mentioned and how you compare." },
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
                Takes about 2 minutes to set up. You can skip any step and configure later.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Enter the brand you want to track. We'll count every time an LLM mentions it.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Brand name</label>
                <input 
                  placeholder="e.g. Obsidian" 
                  autoFocus
                  value={form.brand} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, brand: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium text-foreground">
                  Other spellings (Aliases)
                  <span className="block text-xs text-muted-foreground font-normal mt-1">
                    Domains, abbreviations, old names — any way someone might write your brand.
                  </span>
                </label>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.aliases.map((a, i) => (
                    <span key={i} className="bg-accent/15 text-accent border border-accent/30 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
                      {a}
                      <X size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setForm({ ...form, aliases: form.aliases.filter((_, x) => x !== i) })}/>
                    </span>
                  ))}
                </div>
                
                <input 
                  placeholder="Type an alias and press Enter"
                  value={aliasInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAliasInput(e.target.value)}
                  onKeyDown={handleAddAlias}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Which brands are you competing against? Pick from suggestions or add your own.
              </p>
              
              <div className="grid gap-2">
                {competitorSuggestions.map(s => {
                  const added = form.competitors.includes(s.name);
                  return (
                    <label key={s.name} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${added ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent"
                        checked={added} 
                        onChange={() => {
                          setForm({ 
                            ...form, 
                            competitors: added 
                              ? form.competitors.filter(c => c !== s.name) 
                              : [...form.competitors, s.name] 
                          });
                        }} 
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.reason}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              <div className="pt-2">
                <input 
                  placeholder="Or type another competitor and press Enter"
                  value={competitorInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompetitorInput(e.target.value)}
                  onKeyDown={handleAddCompetitor}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                What kind of questions should we ask? Don't overthink — you can edit these later.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your category (single word/phrase)</label>
                <input 
                  placeholder="e.g. note-taking, project management"
                  value={form.category} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  We'll implicitly ask: <i>"Best {form.category || "{category}"} app?"</i>, <i>"Top {form.category || "{category}"} tools?"</i>
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium text-foreground">Who uses it? (optional use cases)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.useCases.map((u, i) => (
                    <span key={i} className="bg-muted text-foreground border border-border px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
                      {u}
                      <X size={12} className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => setForm({ ...form, useCases: form.useCases.filter((_, x) => x !== i) })}/>
                    </span>
                  ))}
                </div>
                <input 
                  placeholder="e.g. students, developers — Enter to add"
                  value={useCaseInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseCaseInput(e.target.value)}
                  onKeyDown={handleAddUseCase}
                  className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Creates variations like <i>"Best {form.category || "{category}"} app for students?"</i>
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Check size={32} className="text-accent" strokeWidth={3} />
              </div>
              <p className="text-lg text-foreground max-w-sm mb-4 leading-relaxed">
                Ready to track <strong className="font-bold">{form.brand || "your brand"}</strong> against <strong className="font-bold">{form.competitors.length || 0} competitors</strong>
                {form.category && <> across <strong className="font-bold">{form.category}</strong> queries</>}.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll land on your Dashboard. You can trigger a new Run anytime!
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
            {step > 0 && (
              <Button variant="outline" onClick={prev}>Back</Button>
            )}
            {step < steps.length - 1 && (
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={next}>
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === steps.length - 1 && (
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={async () => {
                if (form.brand) {
                  await api.updateBrands({
                    target: form.brand,
                    target_aliases: [form.brand, ...form.aliases],
                    competitors: form.competitors,
                    competitor_aliases: Object.fromEntries(form.competitors.map(c => [c, [c]])),
                  }).catch(console.error);
                }
                onClose();
                onComplete();
              }}>
                Go to Dashboard <Play size={16} className="ml-2 fill-current" />
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
