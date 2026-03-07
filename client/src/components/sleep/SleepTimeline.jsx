import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Moon, Sunrise, Clock } from "lucide-react";
import { format } from "date-fns";

const qualityColors = {
  poor: "text-red-400 bg-red-500/10 border-red-500/20",
  fair: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  good: "text-primary bg-primary/10 border-primary/20",
  excellent: "text-success bg-success/10 border-success/20",
};

const qualityEmojis = {
  poor: "😔",
  fair: "😐",
  good: "🙂",
  excellent: "😊",
};

const qualityLabels = {
  poor: "Poor",
  fair: "Fair",
  good: "Good",
  excellent: "Excellent",
};

export default function SleepTimeline({ logs = [], onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-navy-800/40">
            <Moon size={32} className="text-text-secondary" />
          </div>
        </div>
        <p className="text-text-secondary text-sm">
          No sleep logged yet today.
        </p>
        <p className="text-text-secondary/60 text-xs mt-1">
          Start tracking your sleep on the Today page!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-13 top-4 bottom-4 w-0.5 bg-linear-to-b from-purple-500/50 via-purple-500/30 to-transparent" />

      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => {
          const sleptTime = format(new Date(log.sleptAt), "h:mm a");
          const wokeTime = format(new Date(log.wokeUpAt), "h:mm a");
          const hours = Math.floor(log.duration / 60);
          const minutes = log.duration % 60;
          const isLast = index === logs.length - 1;
          const qualityColor = qualityColors[log.quality] || qualityColors.good;

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
                  {wokeTime}
                </span>
              </div>

              {/* Timeline dot */}
              <div className="relative z-10 mt-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-3 h-3 rounded-full ${
                    index === 0
                      ? "bg-purple-500 ring-4 ring-purple-500/20"
                      : "bg-purple-500/60"
                  }`}
                />
              </div>

              {/* Content Card */}
              <motion.div
                whileHover={{ x: 4 }}
                className="flex-1 bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Moon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {hours}h {minutes > 0 && `${minutes}m`}
                      </p>
                      <p className="text-xs text-text-secondary flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <Moon size={12} /> {sleptTime}
                        </span>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          <Sunrise size={12} /> {wokeTime}
                        </span>
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(log._id)}
                    className="p-2 rounded-lg text-text-secondary/50 hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>

                {/* Quality Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${qualityColor}`}
                  >
                    <span className="text-sm">
                      {qualityEmojis[log.quality]}
                    </span>
                    {qualityLabels[log.quality]} Sleep
                  </span>
                </div>

                {/* Notes (if any) */}
                {log.notes && (
                  <div className="mt-3 pt-3 border-t border-navy-700/30">
                    <p className="text-xs text-text-secondary italic">
                      "{log.notes}"
                    </p>
                  </div>
                )}
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
            <span className="text-text-secondary">Total sleep sessions</span>
            <span className="font-semibold text-text-primary">
              {logs.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-text-secondary">Total sleep time</span>
            <span className="font-bold text-purple-400 text-lg">
              {(() => {
                const totalMinutes = logs.reduce(
                  (sum, log) => sum + log.duration,
                  0,
                );
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                return `${hrs}h ${mins > 0 ? `${mins}m` : ""}`;
              })()}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
