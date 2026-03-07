import { motion } from "framer-motion";
import { useState } from "react";
import { ListOrdered, Calendar } from "lucide-react";
import WaterCalendar from "../components/water/WaterCalendar";
import WaterTimeline from "../components/water/WaterTimeline";
import { useWaterToday, useDeleteWaterLog } from "../hooks/useWaterData";

export default function StatsPage() {
  const [view, setView] = useState("today"); // "today" or "calendar"
  const { data: waterData, isLoading } = useWaterToday();
  const deleteLog = useDeleteWaterLog();

  const logs = waterData?.logs || [];

  const handleDelete = (id) => {
    deleteLog.mutate(id);
  };

  if (isLoading && view === "today") {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-12 rounded-2xl bg-navy-800/60 w-64" />
        <div className="h-96 rounded-2xl bg-navy-800/60" />
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
              ? "bg-primary text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <ListOrdered size={18} />
          Today's Log
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "calendar"
              ? "bg-primary text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={18} />
          Calendar
        </motion.button>
      </div>

      {/* Content */}
      {view === "today" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-6">
            Intake Timeline
          </h3>
          <WaterTimeline logs={logs} onDelete={handleDelete} />
        </motion.div>
      ) : (
        <WaterCalendar />
      )}
    </motion.div>
  );
}
