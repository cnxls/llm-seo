import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import AppLogo from '../components/layout/AppLogo';

interface HomePageProps {
  onTrackBrand: (brand: string) => void;
}

function Typewriter({ text, speed = 45, delay = 0, onDone }: { text: string; speed?: number; delay?: number; onDone?: () => void }) {
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(delay === 0);
  
  useEffect(() => {
    if (delay > 0) { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }
  }, [delay]);
  
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setShown(prev => {
        if (prev >= text.length) {
          clearInterval(id);
          return prev;
        }
        if (prev + 1 >= text.length) {
          clearInterval(id);
          onDoneRef.current && onDoneRef.current();
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [started, text, speed]);
  
  return <>{text.slice(0, shown)}<span className="caret" style={{ opacity: started ? 1 : 0 }} /></>;
}

export default function HomePage({ onTrackBrand }: HomePageProps) {
  const [introDone, setIntroDone] = useState(false);
  const [brandInput, setBrandInput] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [stats, setStats] = useState({ gpt: 0, claude: 0, gemini: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mesh background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let points: any[] = [];
    let cols = 0;
    let rows = 0;
    const spacing = 75; 
    const mouse = { x: -1000, y: -1000 };
    const magneticRadius = 300; 

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / spacing) + 2;
      rows = Math.ceil(canvas.height / spacing) + 2;
      points = [];

      for (let i = 0; i < cols; i++) {
        const colArray = [];
        for (let j = 0; j < rows; j++) {
          const offsetX = (Math.random() - 0.5) * spacing * 0.9;
          const offsetY = (Math.random() - 0.5) * spacing * 0.9;
          const baseX = (i - 1) * spacing + offsetX;
          const baseY = (j - 1) * spacing + offsetY;
          colArray.push({ baseX, baseY, x: baseX, y: baseY, vx: 0, vy: 0 });
        }
        points.push(colArray);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p = points[i][j];
          const dx = mouse.x - p.baseX;
          const dy = mouse.y - p.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let targetX = p.baseX;
          let targetY = p.baseY;

          if (dist < magneticRadius) {
            // Repel effect: push nodes away from the mouse
            const force = Math.pow(1 - dist / magneticRadius, 2) * 60;
            targetX -= (dx / dist) * force;
            targetY -= (dy / dist) * force;
          }

          // Slightly stiffer spring & more friction for a clean snap-back
          const spring = 0.06;
          const friction = 0.75;
          
          p.vx += (targetX - p.x) * spring;
          p.vy += (targetY - p.y) * spring;
          p.vx *= friction;
          p.vy *= friction;
          
          p.x += p.vx;
          p.y += p.vy;
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows - 1; j++) {
          const p1 = points[i][j];
          const p2 = points[i + 1][j];
          const p3 = points[i][j + 1];
          const p4 = points[i + 1][j + 1];

          for (const tri of [[p1, p2, p3], [p2, p4, p3]]) {
            const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
            const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
            const dx = mouse.x - cx;
            const dy = mouse.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let alpha = 0;
            let strokeAlpha = 0.05;
            if (dist < magneticRadius) {
               const intensity = Math.pow(1 - dist / magneticRadius, 1.4);
               alpha = 0.35 * intensity; 
               strokeAlpha = 0.05 + (0.4 * intensity);
            }
            
            ctx.beginPath();
            ctx.moveTo(tri[0].x, tri[0].y);
            ctx.lineTo(tri[1].x, tri[1].y);
            ctx.lineTo(tri[2].x, tri[2].y);
            ctx.closePath();
            
            ctx.strokeStyle = `rgba(160, 200, 140, ${strokeAlpha})`;
            ctx.stroke();
            
            if (alpha > 0) {
              ctx.fillStyle = `rgba(160, 200, 140, ${alpha})`;
              ctx.fill();
            }
          }
        }
      }

      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Intro Sequence timing
  useEffect(() => {
    setIntroDone(false);
    const t = setTimeout(() => setIntroDone(true), 3000);
    return () => clearTimeout(t);
  }, [replayKey]);

  useEffect(() => {
    if (!brandInput.trim()) { setStats({ gpt: 0, claude: 0, gemini: 0 }); return; }
    const id = setInterval(() => {
      setStats(p => ({
        gpt: p.gpt < 147 ? p.gpt + Math.floor(Math.random()*4) : p.gpt,
        claude: p.claude < 89 ? p.claude + Math.floor(Math.random()*3) : p.claude,
        gemini: p.gemini < 112 ? p.gemini + Math.floor(Math.random()*5) : p.gemini,
      }));
    }, 60);
    return () => clearInterval(id);
  }, [brandInput]);

  const replay = () => {
    setBrandInput(''); setTypingDone(false); setReplayKey(k => k + 1);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background" key={replayKey}>
      {/* Mesh background — fades in midway through intro */}
      <canvas ref={canvasRef} className="mesh-reveal absolute inset-0 z-0 pointer-events-none" />

      {/* Vignette */}
      <div className="absolute inset-0 z-[1] vignette" />

      {/* Ambient glow behind logo during intro */}
      {!introDone && <div className="ambient-glow z-[2]" style={{ animationDuration: `2.2s` }} />}

      {/* THE LOGO */}
      {!introDone ? (
        <div className="logo-journey z-[20]" style={{ animationDuration: `3.0s`, width: 576, height: 576 }}>
          <AppLogo className="rounded-[32px]" animated />
        </div>
      ) : (
        <div className="logo-rest z-[20]" style={{ width: 576, height: 576 }}>
          <AppLogo className="rounded-[32px]" animated />
        </div>
      )}

      {/* Hero column */}
      <div className="absolute inset-0 z-10 flex flex-col items-center pointer-events-none" style={{ paddingTop: 'calc(50vh - 140px)' }}>
        <div className="flex flex-col items-center w-full max-w-2xl px-6 pointer-events-auto">

          {/* Wordmark */}
          <div className="wordmark text-center mb-12" style={{ animationDuration: `1.2s`, animationDelay: `2.2s` }}>
            <div className="text-2xl font-bold tracking-[0.06em] text-foreground">LLM SEO Monitor</div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mt-1">AI Brand Visibility</div>
          </div>

          {/* Content — typewriter + input */}
          <div className="content-fade w-full" style={{ animationDuration: `0.9s`, animationDelay: `3.0s` }}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-10 text-center min-h-[1.5em]">
              {introDone && (
                <Typewriter
                  text="How often does AI mention your brand?"
                  speed={45}
                  onDone={() => setTypingDone(true)}
                />
              )}
            </h1>

            <div className={`w-full transition-all duration-700 ease-out transform ${typingDone ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Enter your brand name…"
                  value={brandInput}
                  onChange={e => setBrandInput(e.target.value)}
                  className="w-full bg-card/90 backdrop-blur-xl border border-border focus:border-accent/50 text-foreground text-lg md:text-xl rounded-2xl px-6 py-5 outline-none transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)] placeholder:text-muted-foreground"
                />
              </div>

              <div className={`grid grid-cols-3 gap-3 mt-6 transition-all duration-500 overflow-hidden ${brandInput.trim() ? 'max-h-[120px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {[
                  { l: 'GPT-4',  v: stats.gpt },
                  { l: 'Claude', v: stats.claude, accent: true },
                  { l: 'Gemini', v: stats.gemini },
                ].map(s => (
                  <div key={s.l} className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-3 flex flex-col items-center shadow-lg">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">{s.l}</span>
                    <span className={`text-2xl font-mono font-bold ${s.accent ? 'text-accent' : 'text-foreground'}`}>{s.v}</span>
                  </div>
                ))}
              </div>

              <div className={`mt-8 transition-all duration-700 ease-out delay-200 flex justify-center ${brandInput.trim() ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                <Button 
                  size="lg"
                  className="group relative w-full sm:w-auto h-14 px-10 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base rounded-full shadow-[0_8px_20px_hsla(104,30%,40%,0.3)] hover:shadow-[0_15px_40px_hsla(104,30%,40%,0.5)] hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                  onClick={() => onTrackBrand(brandInput)}
                >
                  <span className="absolute inset-0 bg-white/10 translate-x-[-100%] skew-x-[-15deg] shimmer" />
                  <span className="relative z-10">Start Tracking</span>
                  <ArrowRight className="w-5 h-5 ml-3 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skip / replay control */}
      <div className="absolute top-6 right-6 z-30 skip-fade flex gap-2">
        {!introDone && (
          <button
            onClick={() => setIntroDone(true)}
            className="text-xs px-3 py-1.5 rounded-md bg-card/70 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground transition"
          >Skip intro</button>
        )}
        {introDone && (
          <button
            onClick={replay}
            className="text-xs px-3 py-1.5 rounded-md bg-card/70 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground transition"
          >↻ Replay intro</button>
        )}
      </div>
    </div>
  );
}
