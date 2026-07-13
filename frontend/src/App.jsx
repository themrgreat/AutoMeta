import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Toaster from './components/Toaster';
import { useAppStore } from './store/useAppStore';

import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import Templates from './pages/Templates';
import Review from './pages/Review';
import Senders from './pages/Senders';

export default function App() {
  const theme = useAppStore((s) => s.theme);

  // Reflect the persisted theme onto <html> for Tailwind's `dark:` variant.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/review" element={<Review />} />
            <Route path="/senders" element={<Senders />} />
          </Routes>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
