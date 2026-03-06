import { motion } from "framer-motion";
import { useState } from "react";
import { BarChart3, Calendar } from "lucide-react";
import WeeklyBarChart from "../components/stats/WeeklyBarChart";
import WaterCalendar from "../components/water/WaterCalendar";
import { useWaterWeek } from "../hooks/useWaterData";

export default function StatsPage() {
  const [view, setView] = useState("week"); // "week" or "month"
  const { data: weekData, isLoading: weekLoading } = useWaterWeek();

  const week = weekData || [];
  const currentGoal = week.length > 0 ? week[week.length - 1].goal : 2500;

  if (weekLoading && view === "week") {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-12 rounded-2xl bg-navy-800/60 w-64" />
        <div className="h-56 rounded-2xl bg-navy-800/60" />
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
      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1.5 w-fit">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("week")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "week"
              ? "bg-primary text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <BarChart3 size={18} />
          Last 7 Days
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("month")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "month"
              ? "bg-primary text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={18} />
          This Month
        </motion.button>
      </div>

      {/* Content */}
      {view === "week" ? (
        <WeeklyBarChart data={week} goal={currentGoal} />
      ) : (
        <WaterCalendar />
      )}
    </motion.div>
  );
}
