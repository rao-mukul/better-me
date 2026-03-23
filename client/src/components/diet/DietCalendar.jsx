import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Utensils, X } from "lucide-react";
import { useState } from "react";
import {
  useDeleteDietLog,
  useDietDay,
  useDietMonth,
} from "../../hooks/useDietData";
import {
  getLogicalDateKey,
  getLogicalDateParts,
} from "../../utils/dayBoundary";
import DietTimeline from "./DietTimeline";

export default function DietCalendar() {
  const logicalToday = getLogicalDateParts();
  const todayStr = getLogicalDateKey();
  const [currentYear, setCurrentYear] = useState(logicalToday.year);
  const [currentMonth, setCurrentMonth] = useState(logicalToday.month);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const { data: monthData, isLoading } = useDietMonth(
    currentYear,
    currentMonth,
  );
  const { data: dayData, isLoading: dayLoading } = useDietDay(selectedDate);
  const deleteDietLog = useDeleteDietLog();

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
    const currentLogicalDate = getLogicalDateParts();
    setCurrentYear(currentLogicalDate.year);
    setCurrentMonth(currentLogicalDate.month);
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
  const dayLogs = dayData?.logs || [];
  const dayTiming = dayData?.timing || {
    mealCount: 0,
    firstMealTime: null,
    lastMealTime: null,
    averageGapMinutes: null,
    feedingWindowMinutes: null,
    overnightGapMinutes: null,
  };

  // Get first day of month (0 = Sunday, 6 = Saturday)
  // Adjust to Monday start (0 = Monday, 6 = Sunday)
  const firstDayOfMonth =
    (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7;

  const getMealCountColor = (mealCount) => {
    if (mealCount === 0) return "bg-navy-700/20";
    if (mealCount >= 6) return "bg-green-500";
    if (mealCount >= 4) return "bg-green-400";
    if (mealCount >= 3) return "bg-green-300";
    if (mealCount >= 2) return "bg-green-200/50";
    return "bg-green-100/30";
  };

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeStr;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatMinutes = (minutes) => {
    if (!Number.isFinite(minutes)) return "-";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const isToday = (day) => {
    return (
      day === logicalToday.day &&
      currentMonth === logicalToday.month &&
      currentYear === logicalToday.year
    );
  };

  const handleDayClick = (date) => {
    if (date > todayStr) return;
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  const closeDayModal = () => {
    setIsDayModalOpen(false);
  };

  const formatReadableDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = (id) => {
    deleteDietLog.mutate(id);
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
          const { day, count, firstMealTime, lastMealTime } = dayData;
          const date = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const colorClass = getMealCountColor(count);
          const isTodayDate = isToday(day);
          const isFuture = date > todayStr;

          return (
            <motion.div
              key={day}
              whileHover={{ scale: isFuture ? 1 : 1.05 }}
              onClick={() => handleDayClick(date)}
              className={`aspect-square rounded-lg ${colorClass} ${
                isTodayDate
                  ? "ring-2 ring-green-400 ring-offset-2 ring-offset-navy-900"
                  : ""
              } ${
                selectedDate === date ? "ring-2 ring-white/80" : ""
              } p-2 flex flex-col items-center justify-center relative group transition-all ${
                isFuture ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  count > 0 ? "text-white" : "text-text-secondary"
                }`}
              >
                {day}
              </span>
              {count > 0 && (
                <>
                  <Utensils size={14} className="text-white/80 mt-1" />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-navy-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 border border-navy-700 shadow-lg">
                    <div className="text-text-secondary">
                      {count} meal{count > 1 ? "s" : ""}
                    </div>
                    {firstMealTime && (
                      <div className="text-text-secondary">
                        First: {formatTime12Hour(firstMealTime)}
                      </div>
                    )}
                    {lastMealTime && (
                      <div className="text-text-secondary">
                        Last: {formatTime12Hour(lastMealTime)}
                      </div>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-navy-800" />
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-text-secondary">
        <span className="font-medium">Meals/day:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-100/30" />
          <span>1</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-200/50" />
          <span>2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-300" />
          <span>3</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-400" />
          <span>4-5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500" />
          <span>6+</span>
        </div>
      </div>

      <AnimatePresence>
        {isDayModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeDayModal}
            />

            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-navy-800 border border-navy-700/50 rounded-t-2xl md:rounded-2xl p-4 sm:p-6 md:max-w-4xl md:w-[92vw] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                  Diet details for {formatReadableDate(selectedDate)}
                </h3>
                <button
                  onClick={closeDayModal}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-navy-700/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {dayLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin h-7 w-7 border-2 border-green-400 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 sm:p-5">
                    <h4 className="text-sm font-semibold text-text-primary mb-4">
                      Meal Timing Summary
                    </h4>

                    {dayTiming.mealCount > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-navy-700/20 border border-navy-700/30 rounded-lg p-3">
                          <p className="text-xs text-text-secondary">Meals</p>
                          <p className="text-base font-semibold text-text-primary mt-1">
                            {dayTiming.mealCount}
                          </p>
                        </div>
                        <div className="bg-navy-700/20 border border-navy-700/30 rounded-lg p-3">
                          <p className="text-xs text-text-secondary">Avg gap</p>
                          <p className="text-base font-semibold text-text-primary mt-1">
                            {formatMinutes(dayTiming.averageGapMinutes)}
                          </p>
                        </div>
                        <div className="bg-navy-700/20 border border-navy-700/30 rounded-lg p-3">
                          <p className="text-xs text-text-secondary">
                            Feeding window
                          </p>
                          <p className="text-base font-semibold text-text-primary mt-1">
                            {formatMinutes(dayTiming.feedingWindowMinutes)}
                          </p>
                        </div>
                        <div className="bg-navy-700/20 border border-navy-700/30 rounded-lg p-3">
                          <p className="text-xs text-text-secondary">
                            First meal
                          </p>
                          <p className="text-sm font-semibold text-text-primary mt-1">
                            {formatTime12Hour(dayTiming.firstMealTime)}
                          </p>
                        </div>
                        <div className="bg-navy-700/20 border border-navy-700/30 rounded-lg p-3">
                          <p className="text-xs text-text-secondary">
                            Last meal
                          </p>
                          <p className="text-sm font-semibold text-text-primary mt-1">
                            {formatTime12Hour(dayTiming.lastMealTime)}
                          </p>
                        </div>
                        <div className="bg-navy-700/20 border border-navy-700/30 rounded-lg p-3">
                          <p className="text-xs text-text-secondary">
                            Night gap
                          </p>
                          <p className="text-base font-semibold text-text-primary mt-1">
                            {formatMinutes(dayTiming.overnightGapMinutes)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-text-secondary text-sm">
                          No meals logged for this day.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-3 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-text-primary mb-4 sm:mb-6">
                      Meal Timeline
                    </h4>
                    <DietTimeline logs={dayLogs} onDelete={handleDelete} />
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
