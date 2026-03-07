import { motion } from "framer-motion";
import { useState } from "react";
import { BarChart3, Calendar, List } from "lucide-react";
import SleepWeeklyChart from "../components/sleep/SleepWeeklyChart";
import SleepCalendar from "../components/sleep/SleepCalendar";
import SleepTimeline from "../components/sleep/SleepTimeline";
import Card from "../components/ui/Card";
import {
  useSleepWeek,
  useSleepToday,
  useDeleteSleepLog,
} from "../hooks/useSleepData";

export default function SleepStatsPage() {
  const [view, setView] = useState("today"); // "today", "week", or "month"
  const { data: weekData, isLoading: weekLoading } = useSleepWeek();
  const { data: todayData, isLoading: todayLoading } = useSleepToday();
  const deleteMutation = useDeleteSleepLog();

  const week = weekData || [];
  const currentTarget = week.length > 0 ? week[week.length - 1].targetHours : 8;
  const logs = todayData?.logs || [];

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  if ((weekLoading && view === "week") || (todayLoading && view === "today")) {
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
          onClick={() => setView("today")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "today"
              ? "bg-purple-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <List size={18} />
          Today's Log
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("week")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "week"
              ? "bg-purple-500 text-white"
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
              ? "bg-purple-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={18} />
          This Month
        </motion.button>
      </div>

      {/* Content */}
      {view === "today" ? (
        <Card>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-6">
            Today's Sleep Sessions
          </h3>
          <SleepTimeline logs={logs} onDelete={handleDelete} />
        </Card>
      ) : view === "week" ? (
        <SleepWeeklyChart data={week} targetHours={currentTarget} />
      ) : (
        <SleepCalendar />
      )}
    </motion.div>
  );
}
