import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Page } from '../App';
import AppLogo from '../components/layout/AppLogo';

interface HomePageProps {
  onNavigate: (page: Page, payload?: { brand: string }) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const fullText = "How often does AI mention your brand?";
  const [typedText, setTypedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [brandInput, setBrandInput] = useState('');
  
  const [fakeStats, setFakeStats] = useState({ gpt: 0, claude: 0, gemini: 0 });

  const glowRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = -1000; let mouseY = -1000;
    let currX = -1000; let currY = -1000;
    let tiltX = 0; let tiltY = 0;
    let currTiltX = 0; let currTiltY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      
      // Calculate max 6 degrees of tilt based on mouse position
      tiltX = ((mouseY / wh) - 0.5) * -6; 
      tiltY = ((mouseX / ww) - 0.5) * 6;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let raf: number;
    const animate = () => {
      // Smooth linear interpolation (lerp)
      currX += (mouseX - currX) * 0.12;
      currY += (mouseY - currY) * 0.12;
      
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(300px circle at ${currX}px ${currY}px, rgba(124, 157, 109, 0.15), transparent 70%)`;
      }
      
      // Hover tilt lerp
      currTiltX += (tiltX - currTiltX) * 0.1;
      currTiltY += (tiltY - currTiltY) * 0.1;
      
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(1200px) rotateX(${currTiltX}deg) rotateY(${currTiltY}deg)`;
      }

      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, currentIdx + 1));
      currentIdx++;
      if (currentIdx === fullText.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 45); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!brandInput.trim()) {
      setFakeStats({ gpt: 0, claude: 0, gemini: 0 });
      return;
    }
    const interval = setInterval(() => {
      setFakeStats(prev => ({
        gpt: prev.gpt < 147 ? prev.gpt + Math.floor(Math.random() * 4) : prev.gpt,
        claude: prev.claude < 89 ? prev.claude + Math.floor(Math.random() * 3) : prev.claude,
        gemini: prev.gemini < 112 ? prev.gemini + Math.floor(Math.random() * 5) : prev.gemini,
      }));
    }, 60);
    return () => clearInterval(interval);
  }, [brandInput]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-background">
      {/* Background Animated Grid & Glow */}
      <div className="absolute inset-0 bg-animated-grid opacity-30 pointer-events-none" />
      
      {/* Interactive Cursor Light (Hardware Accelerated) */}
      <div 
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-0 will-change-[background]"
      />
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center text-center -mt-20">
        
        {/* Logo (Static, not rotating) */}
        <div className="mb-20 opacity-0 animate-fade-in-up">
          <AppLogo className="w-24 h-24 rounded-[32px] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]" />
        </div>

        {/* 3D Tilt Wrapper for Text and Inputs only */}
        <div ref={tiltRef} className="w-full flex flex-col items-center will-change-transform">

          {/* Typewriter Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-12 h-[120px] md:h-[60px] flex items-center justify-center">
            {typedText}
            <span className={`inline-block w-1 h-[1em] bg-primary ml-1 ${isTypingDone ? 'animate-pulse' : ''}`} />
          </h1>

          {/* Input Field Area */}
          <div className={`w-full transition-all duration-700 ease-out transform ${isTypingDone ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Enter your brand name..." 
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                className="w-full bg-card/90 backdrop-blur-xl border border-border focus:border-primary/50 text-foreground text-xl md:text-2xl rounded-2xl px-8 py-6 outline-none transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group-hover:shadow-[0_20px_50px_rgba(124,157,109,0.12)] placeholder:text-muted-foreground"
              />
            </div>

            {/* Fake Stats Preview */}
            <div className={`grid grid-cols-3 gap-4 mt-8 transition-all duration-500 overflow-hidden ${brandInput.trim() ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 flex flex-col items-center shadow-lg">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">GPT-4</span>
                <span className="text-3xl font-mono font-bold text-foreground">{fakeStats.gpt}</span>
              </div>
              <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1 relative z-10">Claude</span>
                <span className="text-3xl font-mono font-bold text-primary relative z-10">{fakeStats.claude}</span>
              </div>
              <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 flex flex-col items-center shadow-lg">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Gemini</span>
                <span className="text-3xl font-mono font-bold text-foreground">{fakeStats.gemini}</span>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className={`mt-10 transition-all duration-500 delay-300 ${brandInput.trim() ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
              <Button 
                size="lg" 
                className="h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-full shadow-[0_10px_30px_rgba(124,157,109,0.3)] hover:shadow-[0_15px_45px_rgba(124,157,109,0.5)] hover:-translate-y-1 transition-all duration-300 group w-full sm:w-auto overflow-hidden relative"
                onClick={() => onNavigate('dashboard', { brand: brandInput })}
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shimmer_1.5s_ease-out]" />
                <span className="relative z-10">Start Tracking</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
