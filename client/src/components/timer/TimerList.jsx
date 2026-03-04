import { motion, AnimatePresence } from "framer-motion";
import TimerCard from "./TimerCard";

export default function TimerList({
  timers,
  onReset,
  onEdit,
  onDelete,
  onViewStats,
  disabled,
}) {
  if (!timers || timers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-sm mb-2">No active timers yet</p>
        <p className="text-text-secondary text-xs">
          Create your first clean timer to start tracking!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {timers.map((timer) => (
          <TimerCard
            key={timer._id}
            timer={timer}
            onReset={onReset}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewStats={onViewStats}
            disabled={disabled}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
