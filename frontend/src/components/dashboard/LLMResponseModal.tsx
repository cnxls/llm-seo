import { useEffect, useState, useRef } from 'react';
import { api } from '../../api';
import { QueryRawData } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';

interface LLMResponseModalProps {
  runName: string;
  queryId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LLMResponseModal({ runName, queryId, isOpen, onClose }: LLMResponseModalProps) {
  const [data, setData] = useState<QueryRawData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen || queryId === null || !runName) return;

    const id = ++fetchIdRef.current;

    // Kick off fetch in a microtask so setState isn't synchronous in the effect body
    queueMicrotask(() => {
      if (id !== fetchIdRef.current) return;
      setLoading(true);
      setError(null);
    });

    api.getQueryRaw(runName, queryId)
      .then(res => { if (id === fetchIdRef.current) setData(res); })
      .catch(err => { if (id === fetchIdRef.current) setError(err.message); })
      .finally(() => { if (id === fetchIdRef.current) setLoading(false); });

    return () => { fetchIdRef.current++; };
  }, [isOpen, queryId, runName]);

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  };

  const providers = data ? Object.keys(data.response) : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl pr-6 font-semibold">Raw LLM Responses</DialogTitle>
          {data && (
            <p className="text-sm text-muted-foreground mt-2 border-l-2 border-accent pl-3 py-1">
              {data.question || "Unknown query"}
            </p>
          )}
        </DialogHeader>

        {loading && (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-destructive">
            Failed to load raw responses: {error}
          </div>
        )}

        {data && !loading && providers.length > 0 && (
          <Tabs defaultValue={providers[0]} className="mt-4">
            <TabsList className="bg-muted w-full justify-start rounded-md border border-border px-1 py-1 mb-4 flex-wrap h-auto gap-2">
              {providers.map(p => (
                <TabsTrigger 
                  key={p} 
                  value={p}
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded px-3 py-1.5"
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {providers.map((p) => {
              const resp = data.response[p];
              return (
                <TabsContent key={p} value={p} className="m-0 border border-border rounded-md overflow-hidden bg-[#0f172a]">
                  {resp ? (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
                        <Badge variant="outline" className="text-xs bg-muted/50 border-border text-foreground">
                          Model: {resp.model || 'Unknown'}
                        </Badge>
                        <div className="text-xs text-muted-foreground font-mono space-x-3 flex items-center">
                          <span title="Input Tokens">Tokens: in {resp.tokens?.input || 0}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span title="Output Tokens">out {resp.tokens?.output || 0}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span title="Total Tokens" className="text-foreground">tot {resp.tokens?.total || 0}</span>
                        </div>
                      </div>
                      <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar">
                        <pre className="text-sm font-mono text-slate-100 whitespace-pre-wrap word-break-all">
                          {resp.text}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground italic">
                      No response from this provider.
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
