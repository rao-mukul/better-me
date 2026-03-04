import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";

const categoryOptions = [
  { value: "health", label: "Health" },
  { value: "addiction", label: "Addiction" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

const colorOptions = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "pink", label: "Pink" },
];

export default function CreateTimerForm({ onCreate, disabled }) {
  const [showForm, setShowForm] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("other");
  const [color, setColor] = useState("green");
  const [notes, setNotes] = useState("");
  const [startedAt, setStartedAt] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!habitName.trim()) return;

    onCreate({
      habitName: habitName.trim(),
      category,
      color,
      notes,
      startedAt: new Date(startedAt).toISOString(),
    });

    // Reset form
    setHabitName("");
    setCategory("other");
    setColor("green");
    setNotes("");
    setStartedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(true)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-primary hover:bg-primary/80 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={20} />
        Create New Timer
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Create New Timer
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="p-1 hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="habitName"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            What are you staying clean from?*
          </label>
          <input
            id="habitName"
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="e.g., Smoking, Alcohol, Sugar, etc."
            className="w-full px-3 py-2.5 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  color === option.value
                    ? `bg-${option.value}-500 text-white`
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                }`}
                style={
                  color === option.value
                    ? {
                        backgroundColor:
                          option.value === "blue"
                            ? "#3b82f6"
                            : option.value === "green"
                              ? "#22c55e"
                              : option.value === "purple"
                                ? "#a855f7"
                                : option.value === "orange"
                                  ? "#f97316"
                                  : option.value === "red"
                                    ? "#ef4444"
                                    : "#ec4899",
                      }
                    : undefined
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="startedAt"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Start Date & Time
          </label>
          <input
            id="startedAt"
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full px-3 py-2.5 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why is this important to you?"
            className="w-full px-3 py-2.5 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 px-4 py-2.5 bg-bg-secondary text-text-primary font-medium rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled || !habitName.trim()}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Timer
          </button>
        </div>
      </form>
    </motion.div>
  );
}
