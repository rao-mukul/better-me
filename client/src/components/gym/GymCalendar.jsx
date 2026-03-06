import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { useGymMonth } from "../../hooks/useGymData";

// Workout type colors and labels
const workoutConfig = {
  chestTriceps: {
    label: "Chest & Triceps",
    color: "bg-orange-500/80",
    hoverColor: "hover:bg-orange-500/90",
    textColor: "text-orange-100",
  },
  backBiceps: {
    label: "Back & Biceps",
    color: "bg-blue-500/80",
    hoverColor: "hover:bg-blue-500/90",
    textColor: "text-blue-100",
  },
  legsShoulders: {
    label: "Legs & Shoulders",
    color: "bg-purple-500/80",
    hoverColor: "hover:bg-purple-500/90",
    textColor: "text-purple-100",
  },
};

export default function GymCalendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const { data, isLoading } = useGymMonth(currentYear, currentMonth);

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
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Convert to Monday = 0, Sunday = 6
  const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const today = new Date();
  const isCurrentMonth =
    currentYear === today.getFullYear() &&
    currentMonth === today.getMonth() + 1;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-800/40 backdrop-blur-sm border border-navy-700/30 rounded-xl p-6"
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          {data.monthName}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-navy-700/50 transition-colors text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-navy-700/50 transition-colors text-text-secondary hover:text-text-primary"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-navy-700/50 transition-colors text-text-secondary hover:text-text-primary"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-text-secondary py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {data.data.map(({ day, workoutType, exerciseCount }) => {
            const isTodayDate = isCurrentMonth && day === today.getDate();
            const hasWorkout = workoutType !== null;
            const config = hasWorkout ? workoutConfig[workoutType] : null;

            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square rounded-lg ${
                  hasWorkout
                    ? `${config.color} ${config.hoverColor}`
                    : "bg-navy-700/20 hover:bg-navy-700/30"
                } relative cursor-pointer transition-all ${
                  isTodayDate ? "ring-2 ring-accent" : ""
                }`}
                title={
                  hasWorkout
                    ? `${config.label} - ${exerciseCount} exercises`
                    : "Rest day"
                }
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-sm font-medium ${
                      hasWorkout ? config.textColor : "text-text-secondary"
                    }`}
                  >
                    {day}
                  </span>
                  {hasWorkout && (
                    <Dumbbell size={12} className="mt-0.5 opacity-90" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-navy-700/30">
        <div className="flex items-center justify-center gap-6 text-xs text-text-secondary flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-navy-700/20" />
            <span>Rest day</span>
          </div>
          {Object.entries(workoutConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${config.color}`} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
