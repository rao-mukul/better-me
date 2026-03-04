import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Utensils, X } from "lucide-react";
import { format } from "date-fns";

export default function DietLogForm({ onAddLog, disabled }) {
  const [showForm, setShowForm] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [notes, setNotes] = useState("");
  const [eatenAt, setEatenAt] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!foodName || !calories || !protein || !carbs || !fat) return;

    onAddLog({
      foodName,
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
      servingSize: servingSize || undefined,
      eatenAt: new Date(eatenAt).toISOString(),
      notes: notes || undefined,
    });

    // Reset form
    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setServingSize("");
    setNotes("");
    setEatenAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(true)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        <Plus size={20} />
        <span>Log Food</span>
      </motion.button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Utensils size={16} />
          Log Food Entry
        </h3>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="p-1 hover:bg-navy-700/50 rounded-lg transition-colors"
        >
          <X size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Food Name */}
      <div className="mb-3">
        <label className="text-xs text-text-secondary mb-1.5 block">
          Food Name *
        </label>
        <input
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="e.g., Chicken Breast, Brown Rice"
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
          required
        />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-text-secondary mb-1.5 block">
            Calories *
          </label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="200"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
            required
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary mb-1.5 block">
            Protein (g) *
          </label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="25"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
            required
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary mb-1.5 block">
            Carbs (g) *
          </label>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="30"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
            required
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary mb-1.5 block">
            Fat (g) *
          </label>
          <input
            type="number"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="10"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
            required
          />
        </div>
      </div>

      {/* Serving Size */}
      <div className="mb-3">
        <label className="text-xs text-text-secondary mb-1.5 block">
          Serving Size (optional)
        </label>
        <input
          type="text"
          value={servingSize}
          onChange={(e) => setServingSize(e.target.value)}
          placeholder="e.g., 150g, 1 cup"
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
        />
      </div>

      {/* Time */}
      <div className="mb-3">
        <label className="text-xs text-text-secondary mb-1.5 block">
          Eaten at
        </label>
        <input
          type="datetime-local"
          value={eatenAt}
          onChange={(e) => setEatenAt(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-green-500/50 transition-colors"
          required
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="text-xs text-text-secondary mb-1.5 block">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          rows="2"
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 px-4 py-2 rounded-lg bg-navy-700/50 hover:bg-navy-700 text-text-secondary text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Entry
        </button>
      </div>
    </motion.form>
  );
}
