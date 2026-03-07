import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sunrise, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

const qualityOptions = [
  { value: "poor", label: "Poor", emoji: "😔" },
  { value: "fair", label: "Fair", emoji: "😐" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "excellent", label: "Excellent", emoji: "😊" },
];

export default function SleepLogForm({
  activeSleepLog,
  onStartSleep,
  onCompleteSleep,
  onLogComplete,
  disabled,
}) {
  const now = new Date();

  // State for starting sleep
  const [sleptAt, setSleptAt] = useState(format(now, "yyyy-MM-dd'T'HH:mm"));
  const [startNotes, setStartNotes] = useState("");
  const [showStartForm, setShowStartForm] = useState(false);

  // State for completing sleep
  const [wokeUpAt, setWokeUpAt] = useState(format(now, "yyyy-MM-dd'T'HH:mm"));
  const [quality, setQuality] = useState("good");
  const [completeNotes, setCompleteNotes] = useState("");
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  // State for logging past sleep
  const [showPastSleepForm, setShowPastSleepForm] = useState(false);
  const [pastSleptAt, setPastSleptAt] = useState(() => {
    const yesterday = new Date(now);
    yesterday.setHours(22, 0, 0, 0);
    return format(yesterday, "yyyy-MM-dd'T'HH:mm");
  });
  const [pastWokeUpAt, setPastWokeUpAt] = useState(
    format(now, "yyyy-MM-dd'T'HH:mm"),
  );
  const [pastQuality, setPastQuality] = useState("good");
  const [pastNotes, setPastNotes] = useState("");

  const handleStartSleep = (e) => {
    e.preventDefault();

    if (!sleptAt) return;

    onStartSleep({
      sleptAt: new Date(sleptAt).toISOString(),
      notes: startNotes,
    });

    // Reset form
    setSleptAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setStartNotes("");
    setShowStartForm(false);
  };

  const handleCompleteSleep = (e) => {
    e.preventDefault();

    if (!wokeUpAt || !activeSleepLog) return;

    onCompleteSleep({
      id: activeSleepLog._id,
      data: {
        wokeUpAt: new Date(wokeUpAt).toISOString(),
        quality,
        notes: completeNotes,
      },
    });

    // Reset form
    setWokeUpAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setQuality("good");
    setCompleteNotes("");
    setShowCompleteForm(false);
  };

  const handleLogPastSleep = (e) => {
    e.preventDefault();

    if (!pastSleptAt || !pastWokeUpAt) return;

    onLogComplete({
      sleptAt: new Date(pastSleptAt).toISOString(),
      wokeUpAt: new Date(pastWokeUpAt).toISOString(),
      quality: pastQuality,
      notes: pastNotes,
    });

    // Reset form
    const yesterday = new Date();
    yesterday.setHours(22, 0, 0, 0);
    setPastSleptAt(format(yesterday, "yyyy-MM-dd'T'HH:mm"));
    setPastWokeUpAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setPastQuality("good");
    setPastNotes("");
    setShowPastSleepForm(false);
  };

  // If there's an active sleep log, show wake up form
  if (activeSleepLog) {
    const sleptAtTime = new Date(activeSleepLog.sleptAt);

    if (!showCompleteForm) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Moon size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Sleep in progress...
                </p>
                <p className="text-xs text-text-secondary">
                  Started at {format(sleptAtTime, "h:mm a")}
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCompleteForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Sunrise size={20} />
            <span>I Woke Up!</span>
          </motion.button>
        </motion.div>
      );
    }

    return (
      <motion.form
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        onSubmit={handleCompleteSleep}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 mb-4"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Complete Sleep Log
        </h3>

        <div className="mb-3 p-3 bg-navy-700/30 rounded-lg">
          <p className="text-xs text-text-secondary mb-1">Slept at</p>
          <p className="text-sm font-medium text-text-primary">
            {format(sleptAtTime, "EEEE, MMM d 'at' h:mm a")}
          </p>
        </div>

        {/* Wake Time */}
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

        {/* Quality Selector */}
        <div className="mb-3">
          <label className="text-xs text-text-secondary mb-2 block">
            How was your sleep?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {qualityOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setQuality(option.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  quality === option.value
                    ? "bg-purple-500/30 border-2 border-purple-400/50 text-purple-300"
                    : "bg-navy-700/40 border border-navy-600/30 text-text-secondary hover:bg-navy-700/60"
                }`}
              >
                <div className="text-lg mb-0.5">{option.emoji}</div>
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div className="mb-4">
          <label className="text-xs text-text-secondary mb-1.5 block">
            Notes (optional)
          </label>
          <textarea
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            placeholder="Any thoughts about your sleep?"
            rows="2"
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Sleep
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCompleteForm(false)}
            className="px-4 py-2 bg-navy-700/50 hover:bg-navy-700 text-text-secondary font-medium rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </motion.button>
        </div>
      </motion.form>
    );
  }

  // No active sleep log - show "Going to Sleep" and "Log Past Sleep" options
  if (!showStartForm && !showPastSleepForm) {
    return (
      <div className="flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowStartForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors cursor-pointer"
        >
          <Moon size={20} />
          <span>Going to Sleep</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPastSleepForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-navy-700/40 hover:bg-navy-700/60 border border-navy-600/30 rounded-xl text-text-secondary hover:text-text-primary font-medium transition-colors cursor-pointer"
        >
          <Clock size={20} />
          <span>Log Past Sleep</span>
        </motion.button>
      </div>
    );
  }

  // Show past sleep form
  if (showPastSleepForm) {
    return (
      <motion.form
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        onSubmit={handleLogPastSleep}
        className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 mb-4"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Log Past Sleep
        </h3>

        {/* Bedtime */}
        <div className="mb-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
            <Moon size={14} />
            Went to sleep at
          </label>
          <input
            type="datetime-local"
            value={pastSleptAt}
            onChange={(e) => setPastSleptAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors"
            required
          />
        </div>

        {/* Wake Time */}
        <div className="mb-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
            <Sunrise size={14} />
            Woke up at
          </label>
          <input
            type="datetime-local"
            value={pastWokeUpAt}
            onChange={(e) => setPastWokeUpAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors"
            required
          />
        </div>

        {/* Quality Selector */}
        <div className="mb-3">
          <label className="text-xs text-text-secondary mb-2 block">
            How was your sleep?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {qualityOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setPastQuality(option.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  pastQuality === option.value
                    ? "bg-purple-500/30 border-2 border-purple-400/50 text-purple-300"
                    : "bg-navy-700/40 border border-navy-600/30 text-text-secondary hover:bg-navy-700/60"
                }`}
              >
                <div className="text-lg mb-0.5">{option.emoji}</div>
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div className="mb-4">
          <label className="text-xs text-text-secondary mb-1.5 block">
            Notes (optional)
          </label>
          <textarea
            value={pastNotes}
            onChange={(e) => setPastNotes(e.target.value)}
            placeholder="Any thoughts about your sleep?"
            rows="2"
            className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Log Sleep
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPastSleepForm(false)}
            className="px-4 py-2 bg-navy-700/50 hover:bg-navy-700 text-text-secondary font-medium rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </motion.button>
        </div>
      </motion.form>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleStartSleep}
      className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4 mb-4"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Log Bedtime
      </h3>

      {/* Sleep Time */}
      <div className="mb-3">
        <label className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
          <Moon size={14} />
          Going to sleep at
        </label>
        <input
          type="datetime-local"
          value={sleptAt}
          onChange={(e) => setSleptAt(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors"
          required
        />
      </div>

      {/* Notes (Optional) */}
      <div className="mb-4">
        <label className="text-xs text-text-secondary mb-1.5 block">
          Notes (optional)
        </label>
        <textarea
          value={startNotes}
          onChange={(e) => setStartNotes(e.target.value)}
          placeholder="Any notes before bed?"
          rows="2"
          className="w-full px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary outline-none focus:border-purple-400/50 transition-colors resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={disabled}
          className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Sleep Tracking
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowStartForm(false)}
          className="px-4 py-2 bg-navy-700/50 hover:bg-navy-700 text-text-secondary font-medium rounded-lg transition-colors cursor-pointer"
        >
          Cancel
        </motion.button>
      </div>
    </motion.form>
  );
}
