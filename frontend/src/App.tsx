import { useState, useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import RunPage from './pages/RunPage';
import SettingsPage from './pages/SettingsPage';
import Wizard from './components/Wizard';

export type Page = 'home' | 'dashboard' | 'compare' | 'run' | 'settings' | 'glossary';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [trackedBrand, setTrackedBrand] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);
  
  // Theme logic (default to dark)
  const [isLightMode, setIsLightMode] = useState(false);
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [isLightMode]);

  const handleNavigate = (page: Page, payload?: { brand?: string }) => {
    setCurrentPage(page);
    if (payload?.brand) {
      setTrackedBrand(payload.brand);
      // Automatically show wizard if we navigate away from home for the first time
      setShowWizard(true);
    }
  };

  let Content;
  switch (currentPage) {
    case 'home': Content = <HomePage onNavigate={handleNavigate} />; break;
    case 'dashboard': Content = <DashboardPage onOpenCompare={() => handleNavigate('compare')} />; break;
    case 'compare': Content = <ComparePage />; break;
    case 'run': Content = <RunPage onNavigate={handleNavigate} />; break;
    case 'settings': Content = <SettingsPage />; break;
    case 'glossary': Content = <div className="p-6">Glossary here...</div>; break;
    default: Content = <HomePage onNavigate={handleNavigate} />;
  }

  return (
    <AppShell 
      currentPage={currentPage} 
      onNavigate={handleNavigate}
      isLightMode={isLightMode}
      onToggleTheme={() => setIsLightMode(!isLightMode)}
    >
      {Content}
      {showWizard && (
        <Wizard 
          initialBrand={trackedBrand} 
          onClose={() => setShowWizard(false)} 
          onComplete={() => setShowWizard(false)} 
        />
      )}
    </AppShell>
  );
}
