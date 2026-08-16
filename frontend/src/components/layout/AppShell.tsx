import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

interface AppShellProps {
  isLightMode: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export default function AppShell({ isLightMode, onToggleTheme, children }: AppShellProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isRun = location.pathname === '/run';

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar isLightMode={isLightMode} onToggleTheme={onToggleTheme} />
      {/* /run needs a viewport-capped, non-scrolling main so QueryList's own overflow-y-auto can scroll internally; below xl the idle-phase grid stacks and needs normal page scroll instead */}
      <main className={`flex-1 ml-[60px] bg-background overflow-x-hidden h-screen ${isRun ? 'overflow-y-auto xl:overflow-hidden' : 'overflow-y-auto'} ${isHome ? '' : 'p-6'}`}>
        <div className={isHome ? 'h-full' : isRun ? 'h-full flex flex-col w-full' : 'max-w-7xl mx-auto space-y-6'}>
          {children}
        </div>
      </main>
    </div>
  );
}
