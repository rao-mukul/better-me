import { motion } from "framer-motion";
import { useState } from "react";
import { List, Calendar } from "lucide-react";
import SleepCalendar from "../components/sleep/SleepCalendar";
import SleepTimeline from "../components/sleep/SleepTimeline";
import Card from "../components/ui/Card";
import { useSleepWeekLogs, useDeleteSleepLog } from "../hooks/useSleepData";

export default function SleepStatsPage() {
  const [view, setView] = useState("timeline"); // "timeline" or "month"
  const { data: weekLogsData, isLoading: weekLogsLoading } = useSleepWeekLogs();
  const deleteMutation = useDeleteSleepLog();

  const logs = weekLogsData?.logs || [];

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  if (weekLogsLoading && view === "timeline") {
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
      <div className="flex items-center gap-1.5 sm:gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1 sm:p-1.5 w-fit">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("timeline")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "timeline"
              ? "bg-purple-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <List size={16} className="sm:w-4.5 sm:h-4.5" />
          <span className="hidden xs:inline">Last 7 Days</span>
          <span className="xs:hidden">7 Days</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("month")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "month"
              ? "bg-purple-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={16} className="sm:w-4.5 sm:h-4.5" />
          Calendar
        </motion.button>
      </div>

      {/* Content */}
      {view === "timeline" ? (
        <Card className="p-3 sm:p-6">
          <h3 className="text-xs sm:text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 sm:mb-6">
            Sleep Timeline - Last 7 Days
          </h3>
          <SleepTimeline logs={logs} onDelete={handleDelete} />
        </Card>
      ) : (
        <SleepCalendar />
      )}
    </motion.div>
  );
}
