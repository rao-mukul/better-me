import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";

export default function GoalSetter({ stats, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(
    String(stats?.calorieGoal || 2000),
  );
  const [proteinGoal, setProteinGoal] = useState(
    String(stats?.proteinGoal || 150),
  );
  const [carbsGoal, setCarbsGoal] = useState(String(stats?.carbsGoal || 200));
  const [fatGoal, setFatGoal] = useState(String(stats?.fatGoal || 65));

  const handleSave = () => {
    const calories = parseInt(calorieGoal, 10);
    const protein = parseInt(proteinGoal, 10);
    const carbs = parseInt(carbsGoal, 10);
    const fat = parseInt(fatGoal, 10);

    if (
      calories >= 500 &&
      calories <= 10000 &&
      protein >= 0 &&
      protein <= 500 &&
      carbs >= 0 &&
      carbs <= 1000 &&
      fat >= 0 &&
      fat <= 500
    ) {
      onUpdate({
        calorieGoal: calories,
        proteinGoal: protein,
        carbsGoal: carbs,
        fatGoal: fat,
      });
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setCalorieGoal(String(stats?.calorieGoal || 2000));
    setProteinGoal(String(stats?.proteinGoal || 150));
    setCarbsGoal(String(stats?.carbsGoal || 200));
    setFatGoal(String(stats?.fatGoal || 65));
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-center mb-3">
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 w-full"
          >
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Daily Goals
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Calories
                </label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  min="500"
                  max="10000"
                  step="50"
                  className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  min="0"
                  max="500"
                  step="5"
                  className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(e.target.value)}
                  min="0"
                  max="1000"
                  step="5"
                  className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(e.target.value)}
                  min="0"
                  max="500"
                  step="5"
                  className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-lg bg-navy-700/50 hover:bg-navy-700 text-text-secondary text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={disabled}
                className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Save
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
          >
            <span>
              Goals: {stats?.calorieGoal || 2000}cal ·{" "}
              {stats?.proteinGoal || 150}P · {stats?.carbsGoal || 200}C ·{" "}
              {stats?.fatGoal || 65}F
            </span>
            <Pencil
              size={12}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
