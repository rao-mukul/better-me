import { motion, AnimatePresence } from "framer-motion";
import { Trash2, GlassWater, CupSoda, Droplets } from "lucide-react";

const typeIcons = {
  glass: GlassWater,
  bottle: CupSoda,
  custom: Droplets,
};

const typeColors = {
  glass: "text-primary",
  bottle: "text-accent",
  custom: "text-text-secondary",
};

const typeBgColors = {
  glass: "bg-primary/20",
  bottle: "bg-accent/20",
  custom: "bg-navy-700/40",
};

export default function WaterTimeline({ logs = [], onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-navy-800/40">
            <Droplets size={32} className="text-text-secondary" />
          </div>
        </div>
        <p className="text-text-secondary text-sm">
          No water logged yet today.
        </p>
        <p className="text-text-secondary/60 text-xs mt-1">
          Start tracking your hydration on the Today page!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-13 top-4 bottom-4 w-0.5 bg-linear-to-b from-primary/50 via-primary/30 to-transparent" />

      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => {
          const Icon = typeIcons[log.type] || Droplets;
          const color = typeColors[log.type] || "text-text-secondary";
          const bgColor = typeBgColors[log.type] || "bg-navy-700/40";
          const time = new Date(log.loggedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const isLast = index === logs.length - 1;

          return (
            <motion.div
              key={log._id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative flex items-start gap-4 ${!isLast ? "mb-6" : ""}`}
            >
              {/* Time */}
              <div className="w-12 pt-2 text-right">
                <span className="text-xs font-medium text-text-secondary tabular-nums">
                  {time}
                </span>
              </div>

              {/* Timeline dot */}
              <div className="relative z-10 mt-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-3 h-3 rounded-full ${
                    index === 0
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-primary/60"
                  }`}
                />
              </div>

              {/* Content Card */}
              <motion.div
                whileHover={{ x: 4 }}
                className="flex-1 flex items-center gap-3 bg-navy-800/40 border border-navy-700/30 rounded-xl px-4 py-3 group"
              >
                <div className={`p-2.5 rounded-lg ${bgColor} ${color}`}>
                  <Icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {log.label}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {log.amount} ml added
                  </p>
                </div>

                <span className="text-lg font-bold text-primary tabular-nums">
                  {log.amount}
                  <span className="text-xs font-normal text-text-secondary ml-1">
                    ml
                  </span>
                </span>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(log._id)}
                  className="p-2 rounded-lg text-text-secondary/50 hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Summary at the bottom */}
      {logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t border-navy-700/30"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Total entries today</span>
            <span className="font-semibold text-text-primary">
              {logs.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-text-secondary">Total intake</span>
            <span className="font-bold text-primary text-lg">
              {logs.reduce((sum, log) => sum + log.amount, 0)} ml
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
