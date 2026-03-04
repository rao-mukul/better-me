import { NavLink } from "react-router-dom";
import { Home, Droplets, Moon, Dumbbell } from "lucide-react";

const navItems = [
  { to: "/", label: "Today", icon: Home },
  { to: "/water-stats", label: "Water", icon: Droplets },
  { to: "/sleep-stats", label: "Sleep", icon: Moon },
  { to: "/gym-stats", label: "Gym", icon: Dumbbell },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-navy-800/90 backdrop-blur-md border-t border-navy-700/50 z-30">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
