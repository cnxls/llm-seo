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
  
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar isLightMode={isLightMode} onToggleTheme={onToggleTheme} />
      <main className={`flex-1 ml-[60px] bg-background overflow-x-hidden min-h-screen ${isHome ? '' : 'p-6'}`}>
        <div className={isHome ? 'h-full' : 'max-w-7xl mx-auto space-y-6'}>
          {children}
        </div>
      </main>
    </div>
  );
}
