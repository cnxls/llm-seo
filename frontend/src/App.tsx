import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import RunPage from './pages/RunPage';
import SettingsPage from './pages/SettingsPage';
import GlossaryPage from './pages/GlossaryPage';
import Wizard from './components/Wizard';

export type Page = 'home' | 'dashboard' | 'compare' | 'run' | 'settings' | 'glossary';

export default function App() {
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

  const navigate = useNavigate();

  const handleTrackBrand = (brand: string) => {
    setTrackedBrand(brand);
    setShowWizard(true);
    navigate('/dashboard');
  };

  return (
    <AppShell 
      isLightMode={isLightMode}
      onToggleTheme={() => setIsLightMode(!isLightMode)}
    >
      <Routes>
        <Route path="/" element={<HomePage onTrackBrand={handleTrackBrand} />} />
        <Route path="/dashboard" element={<DashboardPage onOpenCompare={() => navigate('/compare')} />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/run" element={<RunPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="*" element={<HomePage onTrackBrand={handleTrackBrand} />} />
      </Routes>
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
