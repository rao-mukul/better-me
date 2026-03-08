import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  startOfWeek,
  endOfWeek,
  eachMonthOfInterval,
  isSameMonth,
} from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView({ timer, stats }) {
  if (!timer) return null;

  const now = new Date();
  const startDate = new Date(timer.startedAt);

  // Get all months from start to now
  const allMonths = eachMonthOfInterval({ start: startDate, end: now });
  const [currentMonthIndex, setCurrentMonthIndex] = useState(
    allMonths.length - 1,
  );
  const currentViewMonth = allMonths[currentMonthIndex];

  // Get calendar view for selected month
  const monthStart = startOfMonth(currentViewMonth);
  const monthEnd = endOfMonth(currentViewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Create a map of reset dates
  const resetDates = new Map();
  if (timer.resetHistory) {
    timer.resetHistory.forEach((reset) => {
      const resetDate = format(new Date(reset.resetAt), "yyyy-MM-dd");
      resetDates.set(resetDate, reset);
    });
  }

  const getDayStatus = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");

    // Future date
    if (isAfter(day, now)) {
      return { type: "future", label: "" };
    }

    // Before timer started
    if (isBefore(day, startDate)) {
      return { type: "before", label: "" };
    }

    // Reset day
    if (resetDates.has(dayStr)) {
      const reset = resetDates.get(dayStr);
      return { type: "reset", label: "R", reason: reset.reason };
    }

    // Check if day is in a clean period
    // Find if this day falls in a period between resets
    let isClean = false;

    if (timer.resetHistory && timer.resetHistory.length > 0) {
      // Sort reset history by date
      const sortedResets = [...timer.resetHistory].sort(
        (a, b) => new Date(a.resetAt) - new Date(b.resetAt),
      );

      // Check if day is after the last reset
      const lastReset = sortedResets[sortedResets.length - 1];
      const lastResetDate = new Date(lastReset.resetAt);

      if (isAfter(day, lastResetDate) || isSameDay(day, lastResetDate)) {
        isClean = true;
      } else {
        // Check if day falls between any reset periods
        for (let i = 0; i < sortedResets.length - 1; i++) {
          const resetStart = new Date(sortedResets[i].resetAt);
          const resetEnd = new Date(sortedResets[i + 1].resetAt);

          if (
            (isAfter(day, resetStart) || isSameDay(day, resetStart)) &&
            isBefore(day, resetEnd)
          ) {
            isClean = true;
            break;
          }
        }
      }
    } else {
      // No resets, so all days since start are clean
      isClean = true;
    }

    if (isClean) {
      // Don't mark today as clean until the day is over
      if (isToday(day)) {
        return { type: "today", label: "•" };
      }
      return { type: "clean", label: "✓" };
    }

    return { type: "normal", label: "" };
  };

  const getColorClass = (status) => {
    switch (status.type) {
      case "clean":
        return "bg-green-500/80 text-white hover:bg-green-500";
      case "today":
        return "bg-blue-500/80 text-white hover:bg-blue-500";
      case "reset":
        return "bg-red-500/80 text-white hover:bg-red-500 cursor-help";
      case "future":
        return "bg-navy-700/20 text-text-secondary/30";
      case "before":
        return "bg-navy-800/20 text-text-secondary/20";
      default:
        return "bg-bg-secondary text-text-secondary";
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setCurrentMonthIndex(Math.max(0, currentMonthIndex - 1))
            }
            disabled={currentMonthIndex === 0}
            className="p-1.5 rounded-lg hover:bg-navy-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} className="text-text-primary" />
          </button>
          <h3 className="text-lg font-semibold text-text-primary min-w-35 text-center">
            {format(currentViewMonth, "MMMM yyyy")}
          </h3>
          <button
            onClick={() =>
              setCurrentMonthIndex(
                Math.min(allMonths.length - 1, currentMonthIndex + 1),
              )
            }
            disabled={currentMonthIndex === allMonths.length - 1}
            className="p-1.5 rounded-lg hover:bg-navy-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} className="text-text-primary" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/80" />
            <span className="text-text-secondary">Clean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500/80" />
            <span className="text-text-secondary">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/80" />
            <span className="text-text-secondary">Reset</span>
          </div>
        </div>
      </div>

      {/* Week day headers */}
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const status = getDayStatus(day);
          const isInViewMonth = isSameMonth(day, currentViewMonth);
          const isTodayDate = isToday(day);

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: status.type !== "future" ? 1.1 : 1 }}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                transition-colors relative
                ${getColorClass(status)}
                ${!isInViewMonth && "opacity-40"}
                ${isTodayDate && "ring-2 ring-primary"}
              `}
              title={status.reason || ""}
            >
              <span className="text-xs font-medium">{format(day, "d")}</span>
              {status.label && (
                <span className="text-xs mt-0.5">{status.label}</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border text-xs text-text-secondary">
        <p>
          <span className="font-semibold">Tip:</span> Green = completed clean
          days, Blue = today (in progress), Red = reset days. Hover over reset
          days to see reasons.
        </p>
      </div>
    </div>
  );
}
