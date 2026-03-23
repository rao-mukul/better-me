import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Moon, Sunrise, Calendar } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";

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

// Helper to format date label
const getDateLabel = (dateString) => {
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
};

// Group logs by date
const groupLogsByDate = (logs) => {
  const groups = {};
  logs.forEach((log) => {
    if (!groups[log.date]) {
      groups[log.date] = [];
    }
    groups[log.date].push(log);
  });

  // Convert to array and sort by date (most recent first)
  return Object.entries(groups)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, logs]) => ({
      date,
      logs: logs.sort((a, b) => new Date(b.wokeUpAt) - new Date(a.wokeUpAt)),
    }));
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
          No sleep logged in the last 7 days.
        </p>
        <p className="text-text-secondary/60 text-xs mt-1">
          Start tracking your sleep on the Today page!
        </p>
      </div>
    );
  }

  const groupedLogs = groupLogsByDate(logs);

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-10 sm:left-13 top-3 sm:top-4 bottom-3 sm:bottom-4 w-0.5 bg-linear-to-b from-purple-500/50 via-purple-500/30 to-transparent" />

      <AnimatePresence mode="popLayout">
        {groupedLogs.map((group, groupIndex) => (
          <div
            key={group.date}
            className={groupIndex > 0 ? "mt-4 sm:mt-8" : ""}
          >
            {/* Date Separator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-navy-800/60 border border-navy-700/40 rounded-lg">
                <Calendar
                  size={12}
                  className="text-purple-400 sm:w-3.5 sm:h-3.5"
                />
                <span className="text-xs sm:text-sm font-semibold text-text-primary">
                  {getDateLabel(group.date)}
                </span>
              </div>
              <div className="flex-1 h-px bg-navy-700/30" />
            </motion.div>

            {/* Logs for this date */}
            {group.logs.map((log, logIndex) => {
              const wokeTime = format(new Date(log.wokeUpAt), "h:mm a");
              const isLastInGroup = logIndex === group.logs.length - 1;
              const qualityColor =
                qualityColors[log.quality] || qualityColors.good;

              return (
                <motion.div
                  key={log._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`relative flex items-start gap-2 sm:gap-4 ${!isLastInGroup ? "mb-3 sm:mb-6" : ""}`}
                >
                  {/* Wake Time */}
                  <div className="w-9 sm:w-12 pt-1.5 sm:pt-2 text-right shrink-0">
                    <span className="text-[10px] sm:text-xs font-semibold text-purple-400 tabular-nums">
                      {wokeTime}
                    </span>
                  </div>

                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1.5 sm:mt-2 shrink-0">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full ${
                        groupIndex === 0 && logIndex === 0
                          ? "bg-purple-500 ring-2 sm:ring-4 ring-purple-500/20"
                          : "bg-purple-500/60"
                      }`}
                    />
                  </div>

                  {/* Content Card */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex-1 bg-navy-800/40 border border-navy-700/30 rounded-lg sm:rounded-xl p-2.5 sm:p-4 group min-w-0"
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2.5 rounded-lg bg-orange-500/20 text-orange-400 shrink-0">
                          <Sunrise size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-text-secondary">
                            Wake-up time
                          </p>
                          <p className="text-base sm:text-lg font-semibold text-text-primary mt-0.5">
                            {wokeTime}
                          </p>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(log._id)}
                        className="p-1.5 sm:p-2 rounded-lg text-text-secondary/50 hover:text-danger hover:bg-danger/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </motion.button>
                    </div>

                    {/* Quality Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border ${qualityColor}`}
                      >
                        <span className="text-xs sm:text-sm">
                          {qualityEmojis[log.quality]}
                        </span>
                        {qualityLabels[log.quality]} quality
                      </span>
                    </div>

                    {/* Notes (if any) */}
                    {log.notes && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-navy-700/30">
                        <p className="text-[10px] sm:text-xs text-text-secondary italic line-clamp-2">
                          "{log.notes}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
