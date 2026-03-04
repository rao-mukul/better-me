import { NavLink } from 'react-router-dom';
import { Droplets, BarChart3, Activity, Volume2, VolumeX } from 'lucide-react';
import useWaterStore from '../../store/waterStore';

const navItems = [
  { to: '/', label: 'Water', icon: Droplets },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function Sidebar() {
  const { soundEnabled, toggleSound } = useWaterStore();

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen fixed left-0 top-0 bg-navy-800/50 backdrop-blur-md border-r border-navy-700/50 z-30">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-navy-700/50">
        <Activity size={22} className="text-primary" />
        <span className="text-base font-bold text-text-primary">BetterMe</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3 mt-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-navy-700/40'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-navy-700/50">
        <button
          onClick={toggleSound}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-navy-700/40 transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </div>
    </aside>
  );
}
