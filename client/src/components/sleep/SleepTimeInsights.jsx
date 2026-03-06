import { motion } from "framer-motion";
import { Moon, Sunrise, TrendingUp, Clock } from "lucide-react";

export default function SleepTimeInsights({ weekData }) {
  // Calculate average bed time and wake time across the week
  const daysWithData = weekData.filter(
    (d) => d.averageBedTime && d.averageWakeTime,
  );

  if (daysWithData.length === 0) {
    return null;
  }

  // Helper to convert HH:mm to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Helper to convert minutes to HH:mm format
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Helper to format time as 12-hour format
  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Calculate average bed time
  const bedTimeMinutes = daysWithData.map((d) =>
    timeToMinutes(d.averageBedTime),
  );
  const avgBedTimeMinutes = Math.round(
    bedTimeMinutes.reduce((a, b) => a + b, 0) / bedTimeMinutes.length,
  );
  const avgBedTime = minutesToTime(avgBedTimeMinutes);

  // Calculate average wake time
  const wakeTimeMinutes = daysWithData.map((d) =>
    timeToMinutes(d.averageWakeTime),
  );
  const avgWakeTimeMinutes = Math.round(
    wakeTimeMinutes.reduce((a, b) => a + b, 0) / wakeTimeMinutes.length,
  );
  const avgWakeTime = minutesToTime(avgWakeTimeMinutes);

  // Calculate average consistency
  const avgBedConsistency = Math.round(
    daysWithData.reduce((sum, d) => sum + d.bedtimeConsistency, 0) /
      daysWithData.length,
  );
  const avgWakeConsistency = Math.round(
    daysWithData.reduce((sum, d) => sum + d.wakeTimeConsistency, 0) /
      daysWithData.length,
  );

  // Determine consistency status
  const getConsistencyColor = (score) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getConsistencyLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  // Check if sleep time is optimal (before 11 PM)
  const isOptimalBedtime = avgBedTimeMinutes <= 23 * 60; // 11 PM

  // Check if wake time is early (before 7 AM)
  const isEarlyWakeTime = avgWakeTimeMinutes <= 7 * 60; // 7 AM

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-primary" size={20} />
        <h3 className="text-lg font-bold text-text-primary">Sleep Schedule</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bed Time Section */}
        <div className="bg-navy-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Moon size={18} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">Average Bed Time</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatTime12Hour(avgBedTime)}
              </p>
            </div>
            {isOptimalBedtime && (
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                ✓ On time
              </span>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-navy-600/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-secondary">Consistency</span>
              <span
                className={`text-sm font-semibold ${getConsistencyColor(avgBedConsistency)}`}
              >
                {getConsistencyLabel(avgBedConsistency)}
              </span>
            </div>
            <div className="w-full bg-navy-600/40 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${avgBedConsistency}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  avgBedConsistency >= 80
                    ? "bg-success"
                    : avgBedConsistency >= 60
                      ? "bg-primary"
                      : avgBedConsistency >= 40
                        ? "bg-yellow-400"
                        : "bg-red-400"
                }`}
              />
            </div>
            <p className="text-xs text-text-secondary/70 mt-2">
              {avgBedConsistency >= 80
                ? "You're going to bed at consistent times!"
                : avgBedConsistency >= 60
                  ? "Pretty consistent sleep schedule"
                  : "Try to go to bed at the same time each night"}
            </p>
          </div>
        </div>

        {/* Wake Time Section */}
        <div className="bg-navy-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Sunrise size={18} className="text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">Average Wake Time</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatTime12Hour(avgWakeTime)}
              </p>
            </div>
            {isEarlyWakeTime && (
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                ✓ Early bird
              </span>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-navy-600/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-secondary">Consistency</span>
              <span
                className={`text-sm font-semibold ${getConsistencyColor(avgWakeConsistency)}`}
              >
                {getConsistencyLabel(avgWakeConsistency)}
              </span>
            </div>
            <div className="w-full bg-navy-600/40 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${avgWakeConsistency}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className={`h-full rounded-full ${
                  avgWakeConsistency >= 80
                    ? "bg-success"
                    : avgWakeConsistency >= 60
                      ? "bg-primary"
                      : avgWakeConsistency >= 40
                        ? "bg-yellow-400"
                        : "bg-red-400"
                }`}
              />
            </div>
            <p className="text-xs text-text-secondary/70 mt-2">
              {avgWakeConsistency >= 80
                ? "You're waking up at consistent times!"
                : avgWakeConsistency >= 60
                  ? "Pretty consistent wake schedule"
                  : "Try to wake up at the same time each day"}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Schedule Insight */}
      <div className="mt-4 p-4 bg-navy-700/20 rounded-xl border border-navy-600/20">
        <div className="flex items-start gap-3">
          <TrendingUp className="text-accent mt-1" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary mb-1">
              Schedule Insights
            </p>
            <p className="text-sm text-text-secondary">
              {isOptimalBedtime && isEarlyWakeTime
                ? "Great job! You're sleeping and waking up at optimal times. This schedule helps maximize sleep quality and energy levels."
                : !isOptimalBedtime && isEarlyWakeTime
                  ? `You're waking early at ${formatTime12Hour(avgWakeTime)}, but going to bed late at ${formatTime12Hour(avgBedTime)}. Try going to bed earlier to get more sleep.`
                  : isOptimalBedtime && !isEarlyWakeTime
                    ? `You're going to bed early at ${formatTime12Hour(avgBedTime)}, which is great! Consider waking up a bit earlier to maximize your productive morning hours.`
                    : `Your sleep schedule could be optimized. Try going to bed before 11 PM (currently ${formatTime12Hour(avgBedTime)}) and waking up before 7 AM (currently ${formatTime12Hour(avgWakeTime)}).`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
