import { useState, useEffect } from 'react';
import { api } from '../../api';
import { SSEMessage } from '../../types';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle2, AlertCircle, Play, Square, ArrowRight } from 'lucide-react';
import { Page } from '../../App';

type RunState = 'IDLE' | 'ACTIVE' | 'DONE' | 'ERROR';

interface RunProgressPanelProps {
  selectedIds: number[];
  totalAvailable: number;
  onNavigate: (page: Page) => void;
}

export default function RunProgressPanel({ selectedIds, totalAvailable, onNavigate }: RunProgressPanelProps) {
  const [runState, setRunState] = useState<RunState>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [progressMsg, setProgressMsg] = useState<SSEMessage | null>(null);

  useEffect(() => {
    const unsub = api.subscribeToActiveRun(
      (msg) => {
        setProgressMsg(msg);
        
        if (msg.error) {
          setRunState('ERROR');
          setErrorMsg(msg.error);
        } else if (msg.running) {
          setRunState('ACTIVE');
        } else {
          // If it's not running and we have a run_name, it means it completed
          if (msg.run_name && (msg.completed === msg.total || msg.completed > 0)) {
            setRunState('DONE');
          } else {
            setRunState('IDLE');
          }
        }
      },
      (err) => {
        console.error(err);
      }
    );
    return unsub;
  }, []);

  const handleStart = async () => {
    try {
      setRunState('ACTIVE');
      setErrorMsg(null);
      await api.startRun(selectedIds);
    } catch (err: any) {
      setRunState('ERROR');
      setErrorMsg(err.message || 'Failed to start run');
    }
  };

  const handleStop = async () => {
    try {
      await api.stopRun();
    } catch (err: any) {
      console.error(err);
    }
  };

  const pct = progressMsg && progressMsg.total > 0 
    ? Math.round((progressMsg.completed / progressMsg.total) * 100) 
    : 0;

  return (
    <div className="bg-card border border-border rounded-md shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        Execution Controls
      </h2>

      {runState === 'IDLE' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to start a new analysis run.
            {selectedIds.length > 0 ? (
              <span className="block mt-1">You have selected <strong className="text-foreground">{selectedIds.length}</strong> queries out of {totalAvailable}.</span>
            ) : (
              <span className="block mt-1">Starting will run all <strong className="text-foreground">{totalAvailable}</strong> queries.</span>
            )}
          </p>
          <Button className="w-full bg-accent hover:bg-accent/90 text-white shadow-md transition-all duration-200" onClick={handleStart} size="lg">
            <Play className="w-4 h-4 mr-2" />
            Start Run
          </Button>
        </div>
      )}

      {runState === 'ACTIVE' && (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Progressing...</span>
              <span className="text-accent">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 bg-muted/50" />
            
            <div className="mt-3 text-sm text-muted-foreground text-center tabular-nums">
              Query {progressMsg?.completed || 0} of {progressMsg?.total || 0}
            </div>
          </div>

          <div className="bg-background border border-border p-3 rounded-md min-h-[60px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground italic text-center break-words line-clamp-3">
              {progressMsg?.current_query ? `"${progressMsg.current_query}"` : 'Initializing...'}
            </p>
          </div>

          <Button variant="outline" className="w-full border-rose-500/50 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500" onClick={handleStop}>
            <Square className="w-4 h-4 mr-2" />
            Stop Run
          </Button>
        </div>
      )}

      {runState === 'DONE' && (
        <div className="space-y-6 flex flex-col items-center py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-1">Analysis Complete</h3>
            <p className="text-sm text-muted-foreground">Run name: <span className="font-mono text-foreground">{progressMsg?.run_name}</span></p>
          </div>
          <Button className="w-full bg-accent hover:bg-accent/90 mt-2 shadow-md transition-all duration-200" onClick={() => onNavigate('dashboard')}>
            View Results
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => setRunState('IDLE')}>
            Start New Run
          </Button>
        </div>
      )}

      {runState === 'ERROR' && (
        <div className="space-y-4">
          <Alert variant="destructive" className="bg-rose-950/20 border-rose-900/50">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <AlertTitle className="text-rose-500">Error</AlertTitle>
            <AlertDescription className="text-rose-200/80">
              {errorMsg || 'An unknown error occurred during the run.'}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" onClick={() => setRunState('IDLE')}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
