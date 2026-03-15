import { motion } from "framer-motion";
import {
  TrendingUp,
  Award,
  Target,
  RotateCcw,
  Calendar,
  Clock,
} from "lucide-react";
import { differenceInDays } from "date-fns";

export default function TimerAnalytics({ timer, stats }) {
  if (!timer || !stats) {
    return null;
  }

  const { currentDays, bestStreak, totalResets, averageStreak } = stats;

  // Calculate total clean days (all days from all streaks)
  const totalCleanDays = timer.resetHistory
    ? timer.resetHistory.reduce((sum, r) => sum + r.daysClean, 0) + currentDays
    : currentDays;

  // Calculate success rate (days clean / total days since first start)
  const totalDaysSinceStart =
    differenceInDays(new Date(), new Date(timer.startedAt)) +
    (timer.resetHistory
      ? timer.resetHistory.reduce((sum, r) => sum + r.daysClean, 0)
      : 0);
  const successRate =
    totalDaysSinceStart > 0
      ? Math.round((totalCleanDays / totalDaysSinceStart) * 100)
      : 100;

  // Determine if current streak is a record
  const isNewRecord = currentDays > bestStreak;

  const analyticsCards = [
    {
      icon: Target,
      label: "Current Streak",
      value: currentDays,
      unit: currentDays === 1 ? "day" : "days",
      color: "text-primary",
      bgColor: "bg-primary/20",
      highlight: isNewRecord ? "ðŸ”¥ New Record!" : null,
    },
    {
      icon: Award,
      label: "Best Streak",
      value: bestStreak,
      unit: bestStreak === 1 ? "day" : "days",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
    {
      icon: TrendingUp,
      label: "Average Streak",
      value: averageStreak,
      unit: averageStreak === 1 ? "day" : "days",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      icon: Calendar,
      label: "Total Clean Days",
      value: totalCleanDays,
      unit: totalCleanDays === 1 ? "day" : "days",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      icon: RotateCcw,
      label: "Total Resets",
      value: totalResets,
      unit: totalResets === 1 ? "reset" : "resets",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
    {
      icon: Clock,
      label: "Success Rate",
      value: successRate,
      unit: "%",
      color:
        successRate >= 80
          ? "text-green-400"
          : successRate >= 60
            ? "text-yellow-400"
            : "text-orange-400",
      bgColor:
        successRate >= 80
          ? "bg-green-500/20"
          : successRate >= 60
            ? "bg-yellow-500/20"
            : "bg-orange-500/20",
    },
  ];

  return (
    <>
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {analyticsCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon size={18} className={card.color} />
              </div>
              <span className="text-xs text-text-secondary">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${card.color}`}>
                {card.value}
              </span>
              <span className="text-sm text-text-secondary">{card.unit}</span>
            </div>
            {card.highlight && (
              <div className="mt-2 text-xs font-semibold text-orange-400">
                {card.highlight}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}
