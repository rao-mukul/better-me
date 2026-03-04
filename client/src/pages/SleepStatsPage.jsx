import { motion } from "framer-motion";
import { Trophy, TrendingUp, Moon, Clock } from "lucide-react";
import SleepWeeklyChart from "../components/sleep/SleepWeeklyChart";
import StreakCard from "../components/stats/StreakCard";
import InsightCard from "../components/stats/InsightCard";
import { useSleepWeek, useSleepStreak } from "../hooks/useSleepData";

export default function SleepStatsPage() {
  const { data: weekData, isLoading: weekLoading } = useSleepWeek();
  const { data: streakData, isLoading: streakLoading } = useSleepStreak();

  const week = weekData || [];
  const streak = streakData || { current: 0, longest: 0 };

  // Compute insights from week data
  const totalMinutes = week.reduce((sum, d) => sum + d.totalMinutes, 0);
  const daysWithData = week.filter((d) => d.totalMinutes > 0);
  const avgDaily =
    daysWithData.length > 0
      ? (totalMinutes / daysWithData.length / 60).toFixed(1)
      : 0;
  const bestDay = week.reduce(
    (best, d) => (d.totalMinutes > best.totalMinutes ? d : best),
    { totalMinutes: 0, dayLabel: "-" },
  );
  const currentTarget = week.length > 0 ? week[week.length - 1].targetHours : 8;

  // Calculate average sleep score
  const avgScore =
    daysWithData.length > 0
      ? Math.round(
          daysWithData.reduce((sum, d) => sum + d.sleepScore, 0) /
            daysWithData.length,
        )
      : 0;

  if (weekLoading || streakLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-16 rounded-2xl bg-navy-800/60" />
        <div className="h-56 rounded-2xl bg-navy-800/60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-navy-800/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      <StreakCard
        current={streak.current}
        longest={streak.longest}
        icon={Moon}
        label="sleep target"
      />

      <SleepWeeklyChart data={week} targetHours={currentTarget} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InsightCard
          icon={Trophy}
          label="Best Day"
          value={bestDay.totalMinutes > 0 ? bestDay.dayLabel : "-"}
          color="text-yellow-400"
        />
        <InsightCard
          icon={TrendingUp}
          label="Avg Sleep"
          value={avgDaily}
          unit="h"
          color="text-purple-400"
        />
        <InsightCard
          icon={Moon}
          label="This Week"
          value={(totalMinutes / 60).toFixed(1)}
          unit="h"
          color="text-primary"
        />
        <InsightCard
          icon={Clock}
          label="Avg Score"
          value={avgScore}
          unit="/100"
          color="text-accent"
        />
      </div>
    </motion.div>
  );
}
