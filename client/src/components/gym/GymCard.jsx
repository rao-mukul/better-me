import { motion } from "framer-motion";
import { Dumbbell, Clock, Target } from "lucide-react";

const intensityColors = {
  light: "text-blue-400",
  moderate: "text-orange-400",
  intense: "text-red-400",
  none: "text-text-secondary",
};

const intensityLabels = {
  light: "Light intensity",
  moderate: "Moderate intensity",
  intense: "Intense workout!",
  none: "No data",
};

export default function GymCard({ stats }) {
  const workouts = stats?.totalWorkouts || 0;
  const minutes = stats?.totalMinutes || 0;
  const intensity = stats?.averageIntensity || "none";
  const muscleGroups = stats?.muscleGroupsWorked || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Workouts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Dumbbell size={18} className="text-orange-400" />
          </div>
          <span className="text-xs text-text-secondary">Workouts Today</span>
        </div>
        <div className="text-2xl font-bold text-text-primary">{workouts}</div>
        {minutes > 0 && (
          <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
            <Clock size={12} />
            {minutes} minutes total
          </div>
        )}
      </motion.div>

      {/* Muscle Groups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-navy-700/40">
            <Target size={18} className="text-primary" />
          </div>
          <span className="text-xs text-text-secondary">Muscle Groups</span>
        </div>
        {muscleGroups.length > 0 ? (
          <div className="text-sm font-medium text-text-primary">
            {muscleGroups.join(", ")}
          </div>
        ) : (
          <div className="text-sm text-text-secondary">No workouts yet</div>
        )}
      </motion.div>

      {/* Average Intensity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-navy-700/40">
            <Dumbbell size={18} className={intensityColors[intensity]} />
          </div>
          <span className="text-xs text-text-secondary">Intensity</span>
        </div>
        <div className={`text-lg font-semibold ${intensityColors[intensity]}`}>
          {intensityLabels[intensity]}
        </div>
      </motion.div>
    </div>
  );
}
