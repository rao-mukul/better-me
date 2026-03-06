import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { useState } from "react";
import { useWaterMonth } from "../../hooks/useWaterData";

export default function WaterCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const { data: monthData, isLoading } = useWaterMonth(
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

  // Determine color based on intake
  const getIntakeColor = (totalMl, goal, goalMet) => {
    if (totalMl === 0) return "bg-navy-700/20";
    const percentage = (totalMl / goal) * 100;
    if (goalMet) return "bg-primary";
    if (percentage >= 75) return "bg-primary/70";
    if (percentage >= 50) return "bg-primary/50";
    if (percentage >= 25) return "bg-primary/30";
    return "bg-primary/20";
  };

  const getDayInfo = (day) => {
    return data.find((d) => d.day === day);
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
          const { day, totalMl, goal, goalMet } = dayData;
          const isTodayDate = isToday(day);

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-lg ${getIntakeColor(
                totalMl,
                goal,
                goalMet,
              )} relative cursor-pointer transition-all ${
                isTodayDate ? "ring-2 ring-accent" : ""
              }`}
              title={totalMl > 0 ? `${totalMl}ml / ${goal}ml` : "No data"}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-sm font-medium ${
                    totalMl > 0 ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {day}
                </span>
                {goalMet && (
                  <Droplets size={12} className="text-white mt-0.5" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-navy-700/30">
        <div className="flex items-center justify-center gap-6 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-navy-700/20" />
            <span>No data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/50" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>Goal met</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
