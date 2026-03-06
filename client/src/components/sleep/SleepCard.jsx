import { motion } from "framer-motion";
import { Moon, Star, Sunrise, BedDouble } from "lucide-react";

const qualityColors = {
  poor: "text-red-400",
  fair: "text-orange-400",
  good: "text-primary",
  excellent: "text-success",
  none: "text-text-secondary",
};

const qualityLabels = {
  poor: "Poor sleep",
  fair: "Fair sleep",
  good: "Good sleep",
  excellent: "Excellent sleep!",
  none: "No data",
};

export default function SleepCard({ stats }) {
  const hours = stats?.totalMinutes ? (stats.totalMinutes / 60).toFixed(1) : 0;
  const quality = stats?.averageQuality || "none";
  const targetMet = stats?.targetMet || false;
  const bedTime = stats?.averageBedTime || null;
  const wakeTime = stats?.averageWakeTime || null;

  // Format time as 12-hour format
  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Sleep */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Moon size={18} className="text-purple-400" />
          </div>
          <span className="text-xs text-text-secondary">Total Sleep</span>
        </div>
        <div className="text-2xl font-bold text-text-primary">{hours}h</div>
        <div className="text-xs text-text-secondary mt-1">
          {targetMet ? "✓ Target reached" : `Goal: ${stats?.targetHours || 8}h`}
        </div>
      </motion.div>

      {/* Bed Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <BedDouble size={18} className="text-purple-400" />
          </div>
          <span className="text-xs text-text-secondary">Bed Time</span>
        </div>
        <div className="text-xl font-bold text-text-primary">
          {formatTime12Hour(bedTime)}
        </div>
        {bedTime && (
          <div className="text-xs text-text-secondary mt-1">
            Today's average
          </div>
        )}
      </motion.div>

      {/* Wake Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Sunrise size={18} className="text-orange-400" />
          </div>
          <span className="text-xs text-text-secondary">Wake Time</span>
        </div>
        <div className="text-xl font-bold text-text-primary">
          {formatTime12Hour(wakeTime)}
        </div>
        {wakeTime && (
          <div className="text-xs text-text-secondary mt-1">
            Today's average
          </div>
        )}
      </motion.div>

      {/* Sleep Quality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-navy-700/40">
            <Star size={18} className={qualityColors[quality]} />
          </div>
          <span className="text-xs text-text-secondary">Quality</span>
        </div>
        <div className={`text-lg font-semibold ${qualityColors[quality]}`}>
          {qualityLabels[quality]}
        </div>
      </motion.div>
    </div>
  );
}
