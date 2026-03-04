import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import Card from "../ui/Card";

export default function StreakCard({
  current = 0,
  longest = 0,
  icon: Icon = Flame,
  label = "daily goal",
}) {
  return (
    <Card className="flex items-center gap-4">
      <motion.div
        animate={current > 0 ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        className={`p-3 rounded-xl ${
          current > 0
            ? "bg-orange-500/15 text-orange-400"
            : "bg-navy-700/40 text-text-secondary"
        }`}
      >
        <Icon size={24} />
      </motion.div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-text-primary tabular-nums">
          {current}{" "}
          <span className="text-sm font-medium text-text-secondary">
            day{current !== 1 ? "s" : ""}
          </span>
        </p>
        <p className="text-xs text-text-secondary">
          {label} streak{" "}
          {longest > 0 && `· Best: ${longest} day${longest !== 1 ? "s" : ""}`}
        </p>
      </div>
    </Card>
  );
}
