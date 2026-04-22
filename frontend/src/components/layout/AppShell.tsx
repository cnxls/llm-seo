import { Page } from '../../App';
import Sidebar from './Sidebar';

interface AppShellProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export default function AppShell({ currentPage, onNavigate, isLightMode, onToggleTheme, children }: AppShellProps) {
  const isHome = currentPage === 'home';
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} isLightMode={isLightMode} onToggleTheme={onToggleTheme} />
      <main className={`flex-1 ml-[60px] bg-background overflow-x-hidden min-h-screen ${isHome ? '' : 'p-6'}`}>
        <div className={isHome ? 'h-full' : 'max-w-7xl mx-auto space-y-6'}>
          {children}
        </div>
      </main>
    </div>
  );
}
