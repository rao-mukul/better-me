import { motion } from "framer-motion";
import { format } from "date-fns";
import { RotateCcw, TrendingUp } from "lucide-react";

export default function ResetHistory({ timer }) {
  if (!timer || !timer.resetHistory || timer.resetHistory.length === 0) {
    return (
      <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Reset History
        </h3>
        <div className="text-center py-8">
          <p className="text-text-secondary text-sm">
            No resets yet! Keep up the great work 💪
          </p>
        </div>
      </div>
    );
  }

  // Sort by most recent first
  const sortedHistory = [...timer.resetHistory].sort(
    (a, b) => new Date(b.resetAt) - new Date(a.resetAt),
  );

  return (
    <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Reset History
      </h3>

      <div className="space-y-3">
        {sortedHistory.map((reset, index) => {
          const resetDate = new Date(reset.resetAt);
          const isLatest = index === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-4 rounded-lg border
                ${
                  isLatest
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-bg-secondary border-border"
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      isLatest ? "bg-orange-500/20" : "bg-bg-tertiary"
                    }`}
                  >
                    <RotateCcw
                      size={18}
                      className={
                        isLatest ? "text-orange-400" : "text-text-secondary"
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-text-primary">
                        Reset on {format(resetDate, "MMM d, yyyy")}
                      </p>
                      {isLatest && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mb-2">
                      at {format(resetDate, "h:mm a")}
                    </p>

                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        {reset.daysClean} day{reset.daysClean !== 1 ? "s" : ""}{" "}
                        clean
                      </span>
                    </div>

                    {reset.reason && (
                      <div className="mt-2 p-2 bg-bg-primary/50 rounded text-xs text-text-secondary italic">
                        "{reset.reason}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-text-secondary mb-1">Total Resets</p>
            <p className="text-2xl font-bold text-orange-400">
              {sortedHistory.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Avg Streak</p>
            <p className="text-2xl font-bold text-primary">
              {Math.round(
                sortedHistory.reduce((sum, r) => sum + r.daysClean, 0) /
                  sortedHistory.length,
              )}{" "}
              <span className="text-sm">days</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
