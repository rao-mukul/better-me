import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Utensils, Clock, ImageIcon } from "lucide-react";
import { getMealImageUrl } from "../../utils/imageHelpers";

export default function DietTimeline({ logs = [], onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-navy-800/40">
            <Utensils size={32} className="text-text-secondary" />
          </div>
        </div>
        <p className="text-text-secondary text-sm">
          No meals logged yet today.
        </p>
        <p className="text-text-secondary/60 text-xs mt-1">
          Start tracking your nutrition on the Today page!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-10 sm:left-13 top-3 bottom-3 w-0.5 bg-linear-to-b from-green-500/50 via-green-500/30 to-transparent" />

      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => {
          const time = new Date(log.eatenAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
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
              className={`relative flex items-start gap-2 sm:gap-4 ${!isLast ? "mb-3 sm:mb-6" : ""}`}
            >
              {/* Time */}
              <div className="w-9 sm:w-12 pt-1.5 sm:pt-2 text-right shrink-0">
                <span className="text-[10px] sm:text-xs font-medium text-text-secondary tabular-nums">
                  {time}
                </span>
              </div>

              {/* Timeline dot */}
              <div className="relative z-10 mt-1.5 sm:mt-2 shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full ${
                    index === 0
                      ? "bg-green-500 ring-2 sm:ring-4 ring-green-500/20"
                      : "bg-green-500/60"
                  }`}
                />
              </div>

              {/* Content Card */}
              <motion.div
                whileHover={{ x: 4 }}
                className="flex-1 min-w-0 flex items-start gap-2 sm:gap-3 bg-navy-800/40 border border-navy-700/30 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 group overflow-hidden"
              >
                {/* Image if available */}
                {getMealImageUrl(log, "thumbnail") && (
                  <img
                    src={getMealImageUrl(log, "thumbnail")}
                    alt={log.foodName}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                )}

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-text-primary wrap-break-word leading-tight">
                        {log.foodName}
                      </h4>
                      {log.servingSize && (
                        <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 wrap-break-word">
                          {log.servingSize}
                        </p>
                      )}
                      {log.category && (
                        <span className="inline-block text-[10px] sm:text-xs bg-green-500/10 text-green-400 px-1.5 sm:px-2 py-0.5 rounded-full mt-0.5 sm:mt-1 capitalize">
                          {log.category}
                        </span>
                      )}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-green-400 tabular-nums shrink-0">
                      {log.calories}
                      <span className="text-[10px] sm:text-xs font-normal text-text-secondary ml-0.5 sm:ml-1">
                        cal
                      </span>
                    </span>
                  </div>

                  {/* Macros - More compact on mobile */}
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs mb-1 sm:mb-2">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <span className="text-text-secondary">P:</span>
                      <span className="text-blue-400 font-semibold">
                        {log.protein}g
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <span className="text-text-secondary">C:</span>
                      <span className="text-orange-400 font-semibold">
                        {log.carbs}g
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <span className="text-text-secondary">F:</span>
                      <span className="text-yellow-400 font-semibold">
                        {log.fat}g
                      </span>
                    </div>
                  </div>

                  {/* Notes if available */}
                  {log.notes && (
                    <p className="text-[10px] sm:text-xs text-text-secondary italic mt-1 sm:mt-2 wrap-break-word line-clamp-2">
                      {log.notes}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(log._id)}
                  className="p-1.5 sm:p-2 rounded-lg text-text-secondary/50 hover:text-danger hover:bg-danger/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
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
          className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-navy-700/30"
        >
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-text-secondary">Total meals today</span>
            <span className="font-semibold text-text-primary">
              {logs.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm mt-1.5 sm:mt-2">
            <span className="text-text-secondary">Total calories</span>
            <span className="font-bold text-green-400 text-base sm:text-lg">
              {logs.reduce((sum, log) => sum + log.calories, 0)} cal
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
