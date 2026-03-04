import { Outlet } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import useWaterStore from '../../store/waterStore';

export default function AppShell() {
  const { soundEnabled, toggleSound } = useWaterStore();

  return (
    <div className="min-h-screen bg-navy-900">
      <Sidebar />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14 bg-navy-900/80 backdrop-blur-md border-b border-navy-700/30 z-30">
        <span className="text-base font-bold text-text-primary">LifeTracker</span>
        <button
          onClick={toggleSound}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </header>

      {/* Main content */}
      <main className="md:ml-56 pt-14 md:pt-0 pb-20 md:pb-6 min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
