import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Timer } from "lucide-react";
import CreateTimerForm from "../components/timer/CreateTimerForm";
import TimerList from "../components/timer/TimerList";
import {
  useAllTimers,
  useCreateTimer,
  useResetTimer,
  useDeleteTimer,
} from "../hooks/useCleanTimer";

export default function CleanTimerPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useAllTimers();
  const createTimer = useCreateTimer();
  const resetTimer = useResetTimer();
  const deleteTimer = useDeleteTimer();

  const timers = data?.timers || [];

  const handleCreate = (timerData) => {
    createTimer.mutate(timerData, {
      onSuccess: () => {
        toast.success("Timer created successfully! Stay strong 💪", {
          duration: 2000,
        });
      },
      onError: (error) => {
        toast.error(error?.response?.data?.error || "Failed to create timer");
      },
    });
  };

  const handleReset = (payload) => {
    resetTimer.mutate(payload, {
      onSuccess: () => {
        toast.success("Timer reset. Start fresh! 🔄", {
          duration: 2000,
        });
      },
      onError: (error) => {
        toast.error(error?.response?.data?.error || "Failed to reset timer");
      },
    });
  };

  const handleDelete = (id) => {
    deleteTimer.mutate(id, {
      onSuccess: () => {
        toast.success("Timer deleted", {
          duration: 2000,
        });
      },
      onError: (error) => {
        toast.error(error?.response?.data?.error || "Failed to delete timer");
      },
    });
  };

  const handleViewStats = (id) => {
    navigate(`/clean-timer/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-navy-800/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-navy-800/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/20">
          <Timer size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Clean Since Timers
          </h1>
          <p className="text-sm text-text-secondary">
            Track your journey to a better you
          </p>
        </div>
      </div>

      {/* Create Timer Form */}
      <CreateTimerForm
        onCreate={handleCreate}
        disabled={createTimer.isPending}
      />

      {/* Timer List */}
      <TimerList
        timers={timers}
        onReset={handleReset}
        onDelete={handleDelete}
        onViewStats={handleViewStats}
        disabled={resetTimer.isPending || deleteTimer.isPending}
      />

      {/* Stats Summary */}
      {timers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-5 bg-navy-800/40 border border-navy-700/30 rounded-xl"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">Active Timers</p>
              <p className="text-2xl font-bold text-primary">{timers.length}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Total Resets</p>
              <p className="text-2xl font-bold text-orange-400">
                {timers.reduce(
                  (sum, t) => sum + (t.resetHistory?.length || 0),
                  0,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Best Streak</p>
              <p className="text-2xl font-bold text-green-400">
                {timers.reduce((max, t) => {
                  const best =
                    t.resetHistory && t.resetHistory.length > 0
                      ? Math.max(...t.resetHistory.map((r) => r.daysClean))
                      : 0;
                  return Math.max(max, best);
                }, 0)}{" "}
                <span className="text-sm">days</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Categories</p>
              <p className="text-2xl font-bold text-purple-400">
                {new Set(timers.map((t) => t.category)).size}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
