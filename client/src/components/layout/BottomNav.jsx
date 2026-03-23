import { NavLink } from "react-router-dom";
import { Home, Droplets, Moon, Dumbbell, Utensils, Timer, Bot } from "lucide-react";

const navItems = [
  { to: "/", label: "Today", icon: Home },
  { to: "/diet-stats", label: "Diet", icon: Utensils },
  { to: "/gym-stats", label: "Gym", icon: Dumbbell },
  { to: "/water-stats", label: "Water", icon: Droplets },
  { to: "/sleep-stats", label: "Sleep", icon: Moon },
  { to: "/clean-timer", label: "Timer", icon: Timer },
  { to: "/assistant", label: "AI", icon: Bot },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-navy-800/90 backdrop-blur-md border-t border-navy-700/50 z-30">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
