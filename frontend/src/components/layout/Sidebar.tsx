import { Home, BarChart2, GitCompare, Play, Settings, Book, Sun, Moon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AppLogo from './AppLogo';

const ITEMS = [
  { id: 'home', path: '/', label: 'Home', icon: Home },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'compare', path: '/compare', label: 'Compare', icon: GitCompare },
  { id: 'run', path: '/run', label: 'Run', icon: Play },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
  { id: 'glossary', path: '/glossary', label: 'Glossary', icon: Book },
] as const;

interface SidebarProps {
  isLightMode: boolean;
  onToggleTheme: () => void;
}

export default function Sidebar({ isLightMode, onToggleTheme }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed left-0 top-0 bottom-0 z-40 bg-card border-r border-border overflow-hidden transition-[width] duration-200 ease-out w-[60px] hover:w-[220px] flex flex-col group shadow-lg">
      <div className="h-16 flex items-center px-3 flex-shrink-0 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate('/')}>
        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
          <AppLogo className="w-full h-full rounded-[10px]" />
        </div>
        <span className="ml-[14px] font-bold text-lg text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
          SEO Monitor
        </span>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-2 mt-4">
        {ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={twMerge(
                clsx(
                  "w-full flex items-center px-2 py-2.5 rounded-md transition-all duration-150 ease-out group/item relative",
                  isActive 
                    ? "bg-accent/10" 
                    : "hover:bg-muted/50"
                )
              )}
            >
              {isActive && (
                <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-md" />
              )}
              <Icon 
                className={clsx(
                  "w-5 h-5 shrink-0 transition-colors", 
                  isActive ? "text-accent" : "text-muted-foreground group-hover/item:text-foreground"
                )} 
              />
              <span 
                className={clsx(
                  "ml-4 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75",
                  isActive ? "text-accent" : "text-muted-foreground group-hover/item:text-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Tools */}
      <div className="p-3 mb-2 space-y-2 border-t border-border mt-auto">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center px-2 py-2.5 rounded-md hover:bg-muted/50 transition-all duration-150 ease-out group/item overflow-hidden"
          title={`Switch to ${isLightMode ? 'Dark' : 'Light'} Mode`}
        >
          {isLightMode ? (
            <Moon className="w-5 h-5 shrink-0 text-muted-foreground group-hover/item:text-foreground transition-colors" />
          ) : (
            <Sun className="w-5 h-5 shrink-0 text-muted-foreground group-hover/item:text-foreground transition-colors" />
          )}
          <span className="ml-4 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 text-muted-foreground group-hover/item:text-foreground">
            {isLightMode ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>
    </div>
  );
}
