import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target,
  RotateCcw,
  Trash2,
  Edit,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  subHours,
} from "date-fns";
import { DAY_START_HOUR } from "../../utils/dayBoundary";

const colorClasses = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    hover: "hover:bg-blue-500/20",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    hover: "hover:bg-green-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    hover: "hover:bg-purple-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    hover: "hover:bg-orange-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    hover: "hover:bg-red-500/20",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    hover: "hover:bg-pink-500/20",
  },
};

export default function TimerCard({
  timer,
  onReset,
  onEdit,
  onDelete,
  onViewStats,
  disabled,
}) {
  const [now, setNow] = useState(new Date());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resetReason, setResetReason] = useState("");

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startedAt = new Date(timer.startedAt);
  const logicalNow = subHours(now, DAY_START_HOUR);
  const logicalStartedAt = subHours(startedAt, DAY_START_HOUR);
  const days = differenceInDays(logicalNow, logicalStartedAt);
  const hours = differenceInHours(now, startedAt) % 24;
  const minutes = differenceInMinutes(now, startedAt) % 60;
  const seconds = Math.floor((now - startedAt) / 1000) % 60;

  const colorStyle = colorClasses[timer.color] || colorClasses.green;

  const handleReset = () => {
    onReset({
      id: timer._id,
      reason: resetReason,
    });
    setShowResetConfirm(false);
    setResetReason("");
  };

  const handleDelete = () => {
    onDelete(timer._id);
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${colorStyle.bg} ${colorStyle.border} border rounded-xl p-5`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2.5 rounded-lg ${colorStyle.bg}`}>
            <Target size={22} className={colorStyle.text} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {timer.habitName}
            </h3>
            <p className="text-xs text-text-secondary capitalize">
              {timer.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onViewStats && (
            <button
              onClick={() => onViewStats(timer._id)}
              disabled={disabled}
              className={`p-2 ${colorStyle.hover} rounded-lg transition-colors disabled:opacity-50`}
              title="View Stats"
            >
              <TrendingUp size={16} className="text-text-secondary" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(timer)}
              disabled={disabled}
              className="p-2 hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50"
              title="Edit Timer"
            >
              <Edit size={16} className="text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-bg-primary/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${colorStyle.text}`}>
              {days}
            </div>
            <div className="text-xs text-text-secondary mt-1">Days</div>
          </div>
          <div className="text-text-secondary text-2xl">:</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              {hours.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-text-secondary mt-1">Hours</div>
          </div>
          <div className="text-text-secondary text-2xl">:</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              {minutes.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-text-secondary mt-1">Mins</div>
          </div>
          <div className="text-text-secondary text-2xl">:</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              {seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-text-secondary mt-1">Secs</div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 mb-4 text-xs text-text-secondary">
        <Calendar size={14} />
        <span>Started {format(startedAt, "MMM d, yyyy 'at' h:mm a")}</span>
      </div>

      {timer.notes && (
        <p className="text-sm text-text-secondary mb-4 italic">{timer.notes}</p>
      )}

      {/* Actions */}
      {!showResetConfirm && !showDeleteConfirm && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-medium rounded-lg transition-colors disabled:opacity-50`}
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={disabled}
            className="px-4 py-2.5 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <p className="text-sm text-text-primary font-medium">
            Reset this timer?
          </p>
          <input
            type="text"
            placeholder="Reason (optional)"
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowResetConfirm(false);
                setResetReason("");
              }}
              className="flex-1 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-medium rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={disabled}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Confirm Reset
            </button>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <p className="text-sm text-text-primary font-medium">
            Delete this timer permanently?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-medium rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={disabled}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Delete
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
