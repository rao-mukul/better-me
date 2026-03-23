import { useState } from "react";
import { motion } from "framer-motion";
import { Sunrise, Loader2 } from "lucide-react";
import { format } from "date-fns";

const qualityOptions = [
  { value: "poor", label: "Poor", emoji: "😔" },
  { value: "fair", label: "Fair", emoji: "😐" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "excellent", label: "Excellent", emoji: "😊" },
];

export default function SleepLogForm({ onLogWake, disabled }) {
  const [wokeUpAt, setWokeUpAt] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [quality, setQuality] = useState("good");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!wokeUpAt) return;

    const wokeUpAtDate = new Date(wokeUpAt);
    onLogWake({
      wokeUpAt: wokeUpAtDate.toISOString(),
      timezoneOffsetMinutes: wokeUpAtDate.getTimezoneOffset(),
      quality,
      notes: "",
    });

    setWokeUpAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setQuality("good");
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 mb-4"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Morning Check-in
      </h3>
      <p className="text-xs text-text-secondary mb-3">
        Log your wake-up time and sleep quality.
      </p>

      <div className="mb-3">
        <label className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
          <Sunrise size={14} />
          Woke up at
        </label>
        <input
          type="datetime-local"
          value={wokeUpAt}
          onChange={(e) => setWokeUpAt(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors"
          required
        />
      </div>

      <div className="mb-4">
        <label className="text-xs text-text-secondary mb-2 block">
          Sleep quality
        </label>
        <div className="grid grid-cols-4 gap-2">
          {qualityOptions.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuality(option.value)}
              disabled={disabled}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                quality === option.value
                  ? "bg-purple-500/30 border-2 border-purple-400/50 text-purple-300"
                  : "bg-navy-700/40 border border-navy-600/30 text-text-secondary hover:bg-navy-700/60"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="text-base mb-0.5">{option.emoji}</div>
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={disabled}
        className="w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Logging Wake-up...
          </span>
        ) : (
          "Log Wake-up"
        )}
      </motion.button>
    </motion.form>
  );
}
