import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sunrise, Clock } from "lucide-react";
import { useState } from "react";
import { useSleepMonth } from "../../hooks/useSleepData";

const wakeTimeColors = {
  after10: "bg-red-500/90 text-white",
  nineTo10: "bg-orange-400/90 text-slate-900",
  eightTo9: "bg-yellow-300/90 text-slate-900",
  sevenTo8: "bg-green-500/90 text-slate-900",
  sixTo7: "bg-green-300/90 text-slate-900",
  before6: "bg-green-200/90 text-slate-900",
  none: "bg-navy-900/40 text-text-secondary",
};

const qualityEmoji = {
  poor: "😔",
  fair: "😐",
  good: "🙂",
  excellent: "😄",
  none: "",
};

const qualityBadgeTone = {
  poor: "bg-red-100/95 ring-red-300/70",
  fair: "bg-amber-100/95 ring-amber-300/70",
  good: "bg-cyan-100/95 ring-cyan-300/70",
  excellent: "bg-emerald-100/95 ring-emerald-300/70",
  none: "",
};

const qualityLabel = {
  poor: "Poor",
  fair: "Fair",
  good: "Good",
  excellent: "Excellent",
  none: "No quality",
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
      <div className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-4 sm:p-6 animate-pulse">
        <div className="h-8 bg-navy-700/40 rounded mb-4 w-48" />
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-navy-700/40 rounded-md sm:rounded-lg"
            />
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

  // Determine color based on wake time (matrix view)
  const getWakeColor = (averageWakeTime) => {
    if (!averageWakeTime) return wakeTimeColors.none;
    const minutes = timeToMinutes(averageWakeTime);
    if (minutes <= 6 * 60) return wakeTimeColors.before6;
    if (minutes <= 7 * 60) return wakeTimeColors.sixTo7;
    if (minutes <= 8 * 60) return wakeTimeColors.sevenTo8;
    if (minutes <= 9 * 60) return wakeTimeColors.eightTo9;
    if (minutes <= 10 * 60) return wakeTimeColors.nineTo10;
    return wakeTimeColors.after10;
  };

  // Helper: convert HH:mm to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const wakeDays = data.filter((d) => d.averageWakeTime);
  const wakeTimes = wakeDays.map((d) => timeToMinutes(d.averageWakeTime));
  const hasWakeData = wakeTimes.length > 0;
  const avgWakeMinutes = hasWakeData
    ? Math.round(wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length)
    : null;
  const avgWakeTime = hasWakeData ? minutesToTime(avgWakeMinutes) : null;
  const earliestWake = hasWakeData
    ? minutesToTime(Math.min(...wakeTimes))
    : null;
  const latestWake = hasWakeData ? minutesToTime(Math.max(...wakeTimes)) : null;

  const wakeGoalMinutes = 7 * 60;
  const wakeBadge =
    hasWakeData && avgWakeMinutes <= wakeGoalMinutes
      ? "Early start"
      : hasWakeData && avgWakeMinutes <= 8 * 60
        ? "On track"
        : "Late start";

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
      className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-4 sm:p-6"
    >
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-text-primary">
          {monthName}
        </h3>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
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
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-text-secondary py-1.5 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {data.map((dayData) => {
          const { day, averageWakeTime, averageQuality } = dayData;
          const isTodayDate = isToday(day);
          const dayQuality = averageQuality || "none";
          const dayEmoji = qualityEmoji[dayQuality];
          const dayBadgeTone = qualityBadgeTone[dayQuality];

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-md sm:rounded-lg ${getWakeColor(
                averageWakeTime,
              )} relative cursor-pointer transition-all ${
                isTodayDate ? "ring-2 ring-accent" : ""
              }`}
              title={
                averageWakeTime
                  ? `Wake: ${formatTime12Hour(averageWakeTime)}\nQuality: ${qualityLabel[averageQuality || "none"]}`
                  : "No data"
              }
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs sm:text-sm font-medium">{day}</span>
              </div>
              {dayEmoji && (
                <div
                  className={`absolute right-0.5 top-0.5 sm:right-1 sm:top-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full ring-1 shadow-sm shadow-black/25 flex items-center justify-center leading-none ${dayBadgeTone}`}
                >
                  <span
                    className="text-xs sm:text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                    aria-hidden="true"
                  >
                    {dayEmoji}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {hasWakeData && (
        <div className="mt-6">
          <div className="mb-4">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-x-3 gap-y-2 text-[10px] sm:text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-navy-900/40" />
                <span>No data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-200/90" />
                <span>Before 6 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-300/90" />
                <span>6–7 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500/90" />
                <span>7–8 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-300/90" />
                <span>8–9 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-400/90" />
                <span>9–10 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500/90" />
                <span>After 10 AM</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-[10px] sm:text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">😄</span>
                <span>Excellent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">🙂</span>
                <span>Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">😐</span>
                <span>Fair</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">😔</span>
                <span>Poor</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="lg:col-span-2 bg-navy-700/20 border border-navy-700/30 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sunrise size={16} className="text-cyan-300" />
                <p className="text-sm font-semibold text-text-primary">
                  Average Wake Time
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-800/50 rounded-lg p-3">
                  <p className="text-xs text-text-secondary">This month</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {formatTime12Hour(avgWakeTime)}
                  </p>
                </div>
                <div className="bg-navy-800/50 rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Status</p>
                  <p className="text-sm font-semibold text-cyan-300">
                    {wakeBadge}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-navy-700/20 border border-navy-700/30 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-cyan-300" />
                <p className="text-sm font-semibold text-text-primary">
                  Wake Snapshot
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-800/50 rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Earliest</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {formatTime12Hour(earliestWake)}
                  </p>
                </div>
                <div className="bg-navy-800/50 rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Latest</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {formatTime12Hour(latestWake)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
