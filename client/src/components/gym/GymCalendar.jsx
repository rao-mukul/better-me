import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Dumbbell, X } from "lucide-react";
import toast from "react-hot-toast";
import NewGymLogForm from "./NewGymLogForm";
import {
  useGymMonth,
  useGymDay,
  useAddGymLog,
  useDeleteWorkout,
  useGymExercises,
  useAddExercise,
  useGymProgram,
  useGymWeekHistory,
} from "../../hooks/useGymData";

// Workout type colors and labels
const workoutConfig = {
  chestTriceps: {
    label: "Chest & Triceps",
    color: "bg-orange-500/80",
    hoverColor: "hover:bg-orange-500/90",
    textColor: "text-orange-100",
  },
  backBiceps: {
    label: "Back & Biceps",
    color: "bg-blue-500/80",
    hoverColor: "hover:bg-blue-500/90",
    textColor: "text-blue-100",
  },
  legsShoulders: {
    label: "Legs & Shoulders",
    color: "bg-purple-500/80",
    hoverColor: "hover:bg-purple-500/90",
    textColor: "text-purple-100",
  },
};

export default function GymCalendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const { data, isLoading } = useGymMonth(currentYear, currentMonth);
  const { data: gymExercises } = useGymExercises();
  const addExercise = useAddExercise();
  const { data: gymProgram } = useGymProgram();
  const { data: gymWeekHistory } = useGymWeekHistory();
  const addGymLog = useAddGymLog();
  const deleteWorkout = useDeleteWorkout();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const { data: selectedDayData, isLoading: selectedDayLoading } =
    useGymDay(selectedDate);

  useEffect(() => {
    if (!data?.data?.length) return;

    const hasSelectedDate = data.data.some(
      (entry) => entry.date === selectedDate,
    );
    if (hasSelectedDate) return;

    const monthTodayEntry = data.data.find((entry) => entry.date === todayStr);
    setSelectedDate(monthTodayEntry ? monthTodayEntry.date : data.data[0].date);
  }, [data, selectedDate, todayStr]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Convert to Monday = 0, Sunday = 6
  const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isCurrentMonth =
    currentYear === today.getFullYear() &&
    currentMonth === today.getMonth() + 1;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectedMonthEntry = data.data.find(
    (entry) => entry.date === selectedDate,
  );
  const selectedLog = selectedDayData?.log || null;

  const handleDaySelect = (dayEntry) => {
    if (dayEntry.date > todayStr) return;
    setSelectedDate(dayEntry.date);
    setIsDayModalOpen(true);
  };

  const handleAddExercise = (exerciseData) => {
    return addExercise.mutateAsync(exerciseData);
  };

  const handleLogWorkout = (formData) => {
    addGymLog.mutate(
      { data: formData, date: selectedDate },
      {
        onSuccess: () => {
          toast.success("Workout logged! Great job 🔥", {
            duration: 2000,
          });
        },
        onError: (error) => {
          toast.error(error?.response?.data?.error || "Failed to log workout");
        },
      },
    );
  };

  const handleDeleteWorkout = (id) => {
    deleteWorkout.mutate(id, {
      onSuccess: () => {
        toast.success("Workout deleted", { duration: 1800 });
      },
      onError: (error) => {
        toast.error(error?.response?.data?.error || "Failed to delete workout");
      },
    });
  };

  const formatWorkoutLabel = (workoutType) => {
    return workoutType
      .replace("chestTriceps", "Chest & Triceps")
      .replace("backBiceps", "Back & Biceps")
      .replace("legsShoulders", "Legs & Shoulders");
  };

  const formatReadableDate = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const closeDayModal = () => {
    setIsDayModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-800/40 backdrop-blur-sm border border-navy-700/30 rounded-xl p-6"
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          {data.monthName}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-navy-700/50 transition-colors text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-navy-700/50 transition-colors text-text-secondary hover:text-text-primary"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-navy-700/50 transition-colors text-text-secondary hover:text-text-primary"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-text-secondary py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {data.data.map(({ day, date, workoutType, exerciseCount }) => {
            const isTodayDate = isCurrentMonth && day === today.getDate();
            const hasWorkout = workoutType !== null;
            const config = hasWorkout ? workoutConfig[workoutType] : null;
            const isFuture = date > todayStr;
            const isSelected = date === selectedDate;

            return (
              <motion.div
                key={day}
                whileHover={{ scale: isFuture ? 1 : 1.05 }}
                onClick={() => handleDaySelect({ date })}
                className={`aspect-square rounded-lg ${
                  hasWorkout
                    ? `${config.color} ${config.hoverColor}`
                    : "bg-navy-700/20 hover:bg-navy-700/30"
                } relative transition-all ${
                  isTodayDate ? "ring-2 ring-accent" : ""
                } ${isSelected ? "ring-2 ring-white/80" : ""} ${
                  isFuture ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                title={
                  isFuture
                    ? "Future day"
                    : hasWorkout
                      ? `${config.label} - ${exerciseCount} exercises`
                      : "Rest day"
                }
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-sm font-medium ${
                      hasWorkout ? config.textColor : "text-text-secondary"
                    }`}
                  >
                    {day}
                  </span>
                  {hasWorkout && (
                    <Dumbbell size={12} className="mt-0.5 opacity-90" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-navy-700/30">
        <div className="flex items-center justify-center gap-6 text-xs text-text-secondary flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-navy-700/20" />
            <span>Rest day</span>
          </div>
          {Object.entries(workoutConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${config.color}`} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isDayModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeDayModal}
            />

            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-navy-800 border border-navy-700/50 rounded-t-2xl md:rounded-2xl p-6 md:max-w-2xl md:w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-text-primary">
                  {selectedDate
                    ? `Workout for ${formatReadableDate(selectedDate)}`
                    : "Select a day"}
                </h4>
                <button
                  onClick={closeDayModal}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-navy-700/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedDayLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                </div>
              ) : selectedLog ? (
                <div
                  className={`bg-navy-800/40 border-l-4 ${
                    selectedLog.workoutType === "chestTriceps"
                      ? "border-l-orange-500 border-r border-t border-b border-orange-500/30"
                      : selectedLog.workoutType === "backBiceps"
                        ? "border-l-blue-500 border-r border-t border-b border-blue-500/30"
                        : "border-l-purple-500 border-r border-t border-b border-purple-500/30"
                  } rounded-xl p-4`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className={`text-lg font-semibold capitalize ${
                          selectedLog.workoutType === "chestTriceps"
                            ? "text-orange-400"
                            : selectedLog.workoutType === "backBiceps"
                              ? "text-blue-400"
                              : "text-purple-400"
                        }`}
                      >
                        {formatWorkoutLabel(selectedLog.workoutType)}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {selectedLog.primaryMuscle} +{" "}
                        {selectedLog.secondaryMuscle}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(selectedLog._id)}
                      disabled={deleteWorkout.isPending}
                      className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-1">
                        Primary ({selectedLog.primaryMuscle})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLog.primaryExercises.map((ex, i) => (
                          <span
                            key={`${ex}-${i}`}
                            className="px-3 py-1 text-xs bg-primary/20 text-primary rounded-full"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-1">
                        Secondary ({selectedLog.secondaryMuscle})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLog.secondaryExercises.map((ex, i) => (
                          <span
                            key={`${ex}-${i}`}
                            className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedLog.duration && (
                      <div className="text-sm text-text-secondary">
                        Duration: {selectedLog.duration} minutes
                      </div>
                    )}

                    {selectedLog.notes && (
                      <div className="text-sm text-text-secondary">
                        Notes: {selectedLog.notes}
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedMonthEntry && selectedMonthEntry.date <= todayStr ? (
                <NewGymLogForm
                  onSubmit={handleLogWorkout}
                  disabled={addGymLog.isPending}
                  allExercises={gymExercises || []}
                  userProgram={gymProgram?.workoutTypes || {}}
                  weekHistory={gymWeekHistory || []}
                  onAddExercise={handleAddExercise}
                />
              ) : (
                <div className="text-sm text-text-secondary py-4">
                  Select a day to view or log workout details.
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
