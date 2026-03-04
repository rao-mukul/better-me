import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

export default function DietCard({ stats }) {
  const caloriesPercent = stats?.calorieGoal
    ? Math.min((stats.totalCalories / stats.calorieGoal) * 100, 100)
    : 0;
  const proteinPercent = stats?.proteinGoal
    ? Math.min((stats.totalProtein / stats.proteinGoal) * 100, 100)
    : 0;
  const carbsPercent = stats?.carbsGoal
    ? Math.min((stats.totalCarbs / stats.carbsGoal) * 100, 100)
    : 0;
  const fatPercent = stats?.fatGoal
    ? Math.min((stats.totalFat / stats.fatGoal) * 100, 100)
    : 0;

  const goalMet = stats?.goalMet || false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Total Calories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Flame size={18} className="text-green-400" />
          </div>
          <span className="text-xs text-text-secondary">Total Calories</span>
        </div>
        <div className="text-2xl font-bold text-text-primary mb-1">
          {stats?.totalCalories || 0}
          <span className="text-sm text-text-secondary font-normal">
            {" "}
            / {stats?.calorieGoal || 2000}
          </span>
        </div>
        <div className="text-xs text-text-secondary mb-2">
          {goalMet
            ? "✓ Goal reached!"
            : `${Math.round(caloriesPercent)}% of goal`}
        </div>
        <div className="w-full bg-navy-700/40 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${caloriesPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`${
              goalMet
                ? "bg-success"
                : "bg-linear-to-r from-green-500 to-teal-500"
            } h-full rounded-full`}
          />
        </div>
      </motion.div>

      {/* Macros Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-navy-700/40">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <span className="text-xs text-text-secondary">Macros</span>
        </div>

        <div className="space-y-3">
          {/* Protein */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">Protein</span>
              <span className="text-xs text-text-primary font-medium">
                {stats?.totalProtein || 0}g / {stats?.proteinGoal || 150}g
              </span>
            </div>
            <div className="w-full bg-navy-700/40 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${proteinPercent}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-blue-500 h-full rounded-full"
              />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">Carbs</span>
              <span className="text-xs text-text-primary font-medium">
                {stats?.totalCarbs || 0}g / {stats?.carbsGoal || 200}g
              </span>
            </div>
            <div className="w-full bg-navy-700/40 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${carbsPercent}%` }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-orange-500 h-full rounded-full"
              />
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">Fat</span>
              <span className="text-xs text-text-primary font-medium">
                {stats?.totalFat || 0}g / {stats?.fatGoal || 65}g
              </span>
            </div>
            <div className="w-full bg-navy-700/40 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fatPercent}%` }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-yellow-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
