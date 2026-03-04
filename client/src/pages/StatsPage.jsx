import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Droplets } from 'lucide-react';
import WeeklyBarChart from '../components/stats/WeeklyBarChart';
import StreakCard from '../components/stats/StreakCard';
import InsightCard from '../components/stats/InsightCard';
import { useWaterWeek, useWaterStreak } from '../hooks/useWaterData';

export default function StatsPage() {
  const { data: weekData, isLoading: weekLoading } = useWaterWeek();
  const { data: streakData, isLoading: streakLoading } = useWaterStreak();

  const week = weekData || [];
  const streak = streakData || { current: 0, longest: 0 };

  // Compute insights from week data
  const totalWeek = week.reduce((sum, d) => sum + d.totalMl, 0);
  const daysWithData = week.filter((d) => d.totalMl > 0);
  const avgDaily = daysWithData.length > 0 ? Math.round(totalWeek / daysWithData.length) : 0;
  const bestDay = week.reduce((best, d) => (d.totalMl > best.totalMl ? d : best), { totalMl: 0, dayLabel: '-' });
  const currentGoal = week.length > 0 ? week[week.length - 1].goal : 2500;

  if (weekLoading || streakLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-16 rounded-2xl bg-navy-800/60" />
        <div className="h-56 rounded-2xl bg-navy-800/60" />
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
      <StreakCard current={streak.current} longest={streak.longest} />

      <WeeklyBarChart data={week} goal={currentGoal} />

      <div className="grid grid-cols-3 gap-3">
        <InsightCard
          icon={Trophy}
          label="Best Day"
          value={bestDay.totalMl > 0 ? bestDay.dayLabel : '-'}
          color="text-yellow-400"
        />
        <InsightCard
          icon={TrendingUp}
          label="Daily Avg"
          value={avgDaily}
          unit="ml"
          color="text-accent"
        />
        <InsightCard
          icon={Droplets}
          label="This Week"
          value={(totalWeek / 1000).toFixed(1)}
          unit="L"
          color="text-primary"
        />
      </div>
    </motion.div>
  );
}
