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
  subDays,
  startOfDay,
} from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView({ timer, stats }) {
  if (!timer) return null;

  const now = new Date();
  const today = startOfDay(now);
  const currentStreakStart = startOfDay(new Date(timer.startedAt));

  const sortedResets = [...(timer.resetHistory || [])].sort(
    (a, b) => new Date(a.resetAt) - new Date(b.resetAt),
  );

  // Reconstruct the earliest streak start from reset history so previous months stay visible.
  const firstRecordedStart =
    sortedResets.length > 0
      ? startOfDay(
          subDays(
            new Date(sortedResets[0].resetAt),
            Number(sortedResets[0].daysClean || 0),
          ),
        )
      : currentStreakStart;

  const historyStart = isBefore(firstRecordedStart, currentStreakStart)
    ? firstRecordedStart
    : currentStreakStart;

  // Get all months from start to now
  const allMonths = eachMonthOfInterval({ start: historyStart, end: now });
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
    const dayStart = startOfDay(day);
    const dayStr = format(day, "yyyy-MM-dd");

    // Future date
    if (isAfter(dayStart, today)) {
      return { type: "future", label: "" };
    }

    // Before first known streak started
    if (isBefore(dayStart, historyStart)) {
      return { type: "before", label: "" };
    }

    // Reset day
    if (resetDates.has(dayStr)) {
      const reset = resetDates.get(dayStr);
      return { type: "reset", label: "R", reason: reset.reason };
    }

    let isClean = false;

    if (sortedResets.length > 0) {
      // Build historical streak windows: [streakStart, resetDate)
      let streakStart = historyStart;

      for (const reset of sortedResets) {
        const resetDate = startOfDay(new Date(reset.resetAt));
        if (
          (isAfter(dayStart, streakStart) ||
            isSameDay(dayStart, streakStart)) &&
          isBefore(dayStart, resetDate)
        ) {
          isClean = true;
          break;
        }
        streakStart = resetDate;
      }
    }

    // Current streak window: [startedAt, today]
    if (
      !isClean &&
      (isAfter(dayStart, currentStreakStart) ||
        isSameDay(dayStart, currentStreakStart))
    ) {
      isClean = true;
    }

    if (isClean) {
      // Don't mark today as clean until the day is over
      if (isToday(dayStart)) {
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
      <div className="flex items-center justify-center mb-4">
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
    </div>
  );
}
