import { motion } from "framer-motion";
import { Moon, TrendingUp, Star } from "lucide-react";

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
  const score = stats?.sleepScore || 0;
  const targetMet = stats?.targetMet || false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

      {/* Sleep Quality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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

      {/* Sleep Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-navy-700/40">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <span className="text-xs text-text-secondary">Sleep Score</span>
        </div>
        <div className="text-2xl font-bold text-text-primary">
          {score}
          <span className="text-sm text-text-secondary">/100</span>
        </div>
        <div className="w-full bg-navy-700/40 rounded-full h-1.5 mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-linear-to-r from-purple-500 to-primary h-full rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
