import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Target } from "lucide-react";
import CalendarView from "../components/timer/CalendarView";
import ResetHistory from "../components/timer/ResetHistory";
import TimerAnalytics from "../components/timer/TimerAnalytics";
import { useTimerStats } from "../hooks/useCleanTimer";

export default function CleanTimerStatsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTimerStats(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-16 rounded-2xl bg-navy-800/60" />
        <div className="h-96 rounded-2xl bg-navy-800/60" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-navy-800/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.timer || !data.stats) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary mb-4">Timer not found</p>
        <button
          onClick={() => navigate("/clean-timer")}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-colors"
        >
          Back to Timers
        </button>
      </div>
    );
  }

  const { timer, stats } = data;

  const colorClasses = {
    blue: "text-blue-400 bg-blue-500/20",
    green: "text-green-400 bg-green-500/20",
    purple: "text-purple-400 bg-purple-500/20",
    orange: "text-orange-400 bg-orange-500/20",
    red: "text-red-400 bg-red-500/20",
    pink: "text-pink-400 bg-pink-500/20",
  };

  const colorClass = colorClasses[timer.color] || colorClasses.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/clean-timer")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors w-fit"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to Timers</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Target size={24} className={colorClass.split(" ")[0]} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {timer.habitName}
          </h1>
          <p className="text-sm text-text-secondary capitalize">
            {timer.category} • Clean for {stats.currentDays} days
          </p>
        </div>
      </div>

      {/* Timer Notes */}
      {timer.notes && (
        <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4">
          <p className="text-sm text-text-secondary italic">"{timer.notes}"</p>
        </div>
      )}

      {/* Analytics Cards */}
      <TimerAnalytics timer={timer} stats={stats} />

      {/* Calendar View */}
      <CalendarView timer={timer} stats={stats} />

      {/* Reset History */}
      <ResetHistory timer={timer} />
    </motion.div>
  );
}
