import { NavLink } from "react-router-dom";
import {
  Home,
  Droplets,
  Moon,
  Dumbbell,
  Utensils,
  Timer,
  Activity,
  Calendar,
  Bot,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/water-stats", label: "Water Stats", icon: Droplets },
  { to: "/sleep-stats", label: "Sleep Stats", icon: Moon },
  { to: "/gym-stats", label: "Gym Stats", icon: Dumbbell },
  { to: "/gym-program", label: "Gym Program", icon: Calendar },
  { to: "/diet-stats", label: "Diet Stats", icon: Utensils },
  { to: "/clean-timer", label: "Clean Since", icon: Timer },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
];

export default function Sidebar() {
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
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-navy-700/40"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
