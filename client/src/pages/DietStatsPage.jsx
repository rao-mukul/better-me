import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import DietWeeklyChart from "../components/diet/DietWeeklyChart";
import MacroRings from "../components/diet/MacroRings";
import StreakCard from "../components/stats/StreakCard";
import InsightCard from "../components/stats/InsightCard";
import { useDietWeek, useDietStreak, useDietToday } from "../hooks/useDietData";

export default function DietStatsPage() {
  const { data: weekData, isLoading: weekLoading } = useDietWeek();
  const { data: streakData, isLoading: streakLoading } = useDietStreak();
  const { data: todayData } = useDietToday();

  const week = weekData || [];
  const streak = streakData || { current: 0, longest: 0 };
  const stats = todayData?.stats;

  // Compute insights from week data
  const totalWeekCalories = week.reduce((sum, d) => sum + d.totalCalories, 0);
  const daysWithData = week.filter((d) => d.totalCalories > 0);
  const avgDailyCalories =
    daysWithData.length > 0
      ? Math.round(totalWeekCalories / daysWithData.length)
      : 0;
  const bestDay = week.reduce(
    (best, d) => (d.totalCalories > best.totalCalories ? d : best),
    { totalCalories: 0, dayLabel: "-" },
  );
  const currentGoal =
    week.length > 0 ? week[week.length - 1].calorieGoal : 2000;

  // Calculate total macros for the week
  const totalProtein = week.reduce((sum, d) => sum + d.totalProtein, 0);
  const totalCarbs = week.reduce((sum, d) => sum + d.totalCarbs, 0);
  const totalFat = week.reduce((sum, d) => sum + d.totalFat, 0);

  if (weekLoading || streakLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-16 rounded-2xl bg-navy-800/60" />
        <div className="h-56 rounded-2xl bg-navy-800/60" />
        <div className="h-48 rounded-2xl bg-navy-800/60" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
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
        title="Nutrition Streak"
        subtitle="Days meeting calorie goal"
      />

      <DietWeeklyChart data={week} goal={currentGoal} />

      <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Today's Macros
        </h3>
        <MacroRings stats={stats} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <InsightCard
          icon={Trophy}
          label="Best Day"
          value={bestDay.totalCalories > 0 ? bestDay.dayLabel : "-"}
          color="text-yellow-400"
        />
        <InsightCard
          icon={TrendingUp}
          label="Daily Avg"
          value={avgDailyCalories}
          unit="cal"
          color="text-green-400"
        />
        <InsightCard
          icon={Flame}
          label="This Week"
          value={totalWeekCalories}
          unit="cal"
          color="text-primary"
        />
      </div>

      <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Weekly Macros Total
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {totalProtein}g
            </div>
            <div className="text-xs text-text-secondary">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {totalCarbs}g
            </div>
            <div className="text-xs text-text-secondary">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {totalFat}g
            </div>
            <div className="text-xs text-text-secondary">Fat</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
