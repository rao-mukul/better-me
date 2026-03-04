import { motion } from "framer-motion";
import { Trophy, TrendingUp, Dumbbell, Target } from "lucide-react";
import GymWeeklyChart from "../components/gym/GymWeeklyChart";
import StreakCard from "../components/stats/StreakCard";
import InsightCard from "../components/stats/InsightCard";
import { useGymWeek, useGymStreak } from "../hooks/useGymData";

export default function GymStatsPage() {
  const { data: weekData, isLoading: weekLoading } = useGymWeek();
  const { data: streakData, isLoading: streakLoading } = useGymStreak();

  const week = weekData || [];
  const streak = streakData || { current: 0, longest: 0, thisWeek: 0 };

  // Compute insights from week data
  const totalWorkouts = week.reduce((sum, d) => sum + d.totalWorkouts, 0);
  const totalMinutes = week.reduce((sum, d) => sum + d.totalMinutes, 0);
  const daysWithData = week.filter((d) => d.totalWorkouts > 0);
  const avgDuration =
    daysWithData.length > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
  const bestDay = week.reduce(
    (best, d) => (d.totalWorkouts > best.totalWorkouts ? d : best),
    { totalWorkouts: 0, dayLabel: "-" },
  );

  // Get all unique muscle groups worked this week
  const muscleGroupsWorked = Array.from(
    new Set(week.flatMap((d) => d.muscleGroupsWorked || [])),
  );

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
        icon={Dumbbell}
        label="weekly workout goal"
      />

      <GymWeeklyChart data={week} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InsightCard
          icon={Trophy}
          label="Best Day"
          value={bestDay.totalWorkouts > 0 ? bestDay.dayLabel : "-"}
          color="text-yellow-400"
        />
        <InsightCard
          icon={TrendingUp}
          label="Total Workouts"
          value={totalWorkouts}
          color="text-orange-400"
        />
        <InsightCard
          icon={Dumbbell}
          label="Avg Duration"
          value={avgDuration}
          unit="min"
          color="text-primary"
        />
        <InsightCard
          icon={Target}
          label="Muscle Groups"
          value={muscleGroupsWorked.length}
          color="text-accent"
        />
      </div>
    </motion.div>
  );
}
