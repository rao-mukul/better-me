import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { useSleepMonth } from "../../hooks/useSleepData";

const qualityColors = {
  poor: "bg-red-400/80",
  fair: "bg-orange-400/80",
  good: "bg-primary",
  excellent: "bg-success",
  none: "bg-navy-700/20",
};

export default function SleepCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const { data: monthData, isLoading } = useSleepMonth(
    currentYear,
    currentMonth,
  );

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  if (isLoading) {
    return (
      <div className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-navy-700/40 rounded mb-4 w-48" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-navy-700/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const data = monthData?.data || [];
  const monthName = monthData?.monthName || "";

  // Get first day of month (0 = Sunday, 6 = Saturday)
  // Adjust to Monday start (0 = Monday, 6 = Sunday)
  const firstDayOfMonth =
    (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7;

  // Determine color based on sleep quality
  const getSleepColor = (totalMinutes, quality) => {
    if (totalMinutes === 0) return "bg-navy-700/20";
    if (quality !== "none") {
      return qualityColors[quality];
    }
    // Fallback to neutral color if no quality is set
    return "bg-primary/50";
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() + 1 &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-6"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text-primary">{monthName}</h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToday}
            className="px-3 py-1.5 text-sm bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            Today
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevMonth}
            className="p-2 bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextMonth}
            className="p-2 bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-text-secondary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {data.map((dayData) => {
          const {
            day,
            totalMinutes,
            totalHours,
            targetHours,
            averageQuality,
            targetMet,
          } = dayData;
          const isTodayDate = isToday(day);

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-lg ${getSleepColor(
                totalMinutes,
                averageQuality,
              )} relative cursor-pointer transition-all ${
                isTodayDate ? "ring-2 ring-accent" : ""
              }`}
              title={
                totalMinutes > 0
                  ? `${totalHours}h sleep\nQuality: ${averageQuality}`
                  : "No data"
              }
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-sm font-medium ${
                    totalMinutes > 0
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  {day}
                </span>
                {averageQuality === "excellent" && (
                  <Star
                    size={10}
                    className="text-yellow-300 absolute top-1 right-1"
                    fill="currentColor"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-navy-700/30">
        <div className="flex items-center justify-center gap-4 text-xs text-text-secondary flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-navy-700/20" />
            <span>No data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400/80" />
            <span>Poor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400/80" />
            <span>Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success" />
            <span>Excellent</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
