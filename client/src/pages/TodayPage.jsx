import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Droplets,
  Moon,
  Dumbbell,
  Utensils,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import Card from "../components/ui/Card";
import ServerWakeupAnimation from "../components/ui/ServerWakeupAnimation";
import WaterRing from "../components/water/WaterRing";
import QuickAddBar from "../components/water/QuickAddBar";
import GoalSetter from "../components/water/GoalSetter";
import WaterAnimation from "../components/water/WaterAnimation";
import SleepLogForm from "../components/sleep/SleepLogForm";
import NewGymLogForm from "../components/gym/NewGymLogForm";
import GymCard from "../components/gym/GymCard";
import NewDietLogForm from "../components/diet/NewDietLogForm";
import VoiceCallModal from "../components/assistant/VoiceCallModal";
import {
  useAddWaterLog,
  useDeleteWaterLog,
  useUpdateGoal,
} from "../hooks/useWaterData";
import { useLogCompleteSleep } from "../hooks/useSleepData";
import {
  useAddGymLog,
  useDeleteWorkout,
  useGymExercises,
  useAddExercise,
  useGymProgram,
} from "../hooks/useGymData";
import { useTodayOverview } from "../hooks/useTodayOverview";

export default function TodayPage() {
  // Refs for each section card to enable scrolling
  const dietRef = useRef(null);
  const waterRef = useRef(null);
  const gymRef = useRef(null);
  const sleepRef = useRef(null);

  // Track which section is expanded (only one at a time) - all collapsed by default
  const [expandedSection, setExpandedSection] = useState(null);
  const [waterActionPending, setWaterActionPending] = useState(false);
  const [sleepActionPending, setSleepActionPending] = useState(false);
  const [gymActionPending, setGymActionPending] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const toggleSection = (section) => {
    // If clicking the currently expanded section, collapse it
    if (expandedSection === section) {
      setExpandedSection(null);
      return;
    }

    // Expand the new section
    setExpandedSection(section);

    // Scroll to the section after allowing the DOM to update
    requestAnimationFrame(() => {
      setTimeout(() => {
        const refs = {
          diet: dietRef,
          water: waterRef,
          gym: gymRef,
          sleep: sleepRef,
        };

        const targetRef = refs[section];
        if (targetRef?.current) {
          const headerOffset = 100; // Offset for top nav bar + padding
          const elementPosition = targetRef.current.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 300); // Increased delay to allow animation to complete
    });
  };

  // Water tracking
  const { data: overview, isLoading: overviewLoading } = useTodayOverview();
  const waterData = overview?.water || null;
  const addLog = useAddWaterLog();
  const deleteLog = useDeleteWaterLog();
  const updateGoal = useUpdateGoal();
  const prevGoalMetRef = useRef(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const logs = waterData?.logs || [];
  const waterStats = waterData?.stats || {
    totalMl: 0,
    goal: 2500,
    goalMet: false,
    entryCount: 0,
  };

  // Sleep tracking
  const sleepData = overview?.sleep || null;
  const logWakeUp = useLogCompleteSleep();
  const sleepStats = sleepData?.stats || {
    totalMinutes: 0,
    targetHours: 8,
    targetMet: false,
    entryCount: 0,
    averageQuality: "none",
    averageWakeTime: null,
  };
  const hasLoggedWakeToday =
    sleepStats.entryCount > 0 && !!sleepStats.averageWakeTime;
  const canExpandSleepSection = !hasLoggedWakeToday;

  // Gym tracking
  const gymData = overview?.gym || null;
  const addGymLog = useAddGymLog();
  const deleteWorkout = useDeleteWorkout();
  const hasGymData = !!gymData;
  const hasGymLog = !!gymData?.log;
  // Prefetch gym form dependencies during page bootstrap so the section opens instantly.
  const { data: gymExercises, isLoading: gymExercisesLoading } =
    useGymExercises();
  const addExercise = useAddExercise();
  const { data: gymProgram, isLoading: gymProgramLoading } = useGymProgram();
  const gymWeekHistory = gymData?.weekHistory || [];

  const todayLog = gymData?.log || null;
  const gymStats = gymData?.stats || {
    totalWorkouts: 0,
    totalMinutes: 0,
    muscleGroupsWorked: [],
    totalExercises: 0,
    averageIntensity: "none",
  };

  const isWaterBusy =
    addLog.isPending ||
    deleteLog.isPending ||
    updateGoal.isPending ||
    waterActionPending;
  const isSleepBusy = logWakeUp.isPending || sleepActionPending;
  const isGymBusy =
    addGymLog.isPending ||
    deleteWorkout.isPending ||
    addExercise.isPending ||
    gymActionPending;

  // Calculate number of unique days with workouts this week
  const weekWorkoutDays = gymWeekHistory
    ? new Set(gymWeekHistory.map((log) => log.date)).size
    : 0;
  const gymBootstrapLoading = gymExercisesLoading || gymProgramLoading;

  // Diet tracking
  const dietData = overview?.diet || null;
  const dietTiming = dietData?.timing || {
    mealCount: 0,
    firstMealTime: null,
    lastMealTime: null,
    averageGapMinutes: null,
    feedingWindowMinutes: null,
    overnightGapMinutes: null,
  };

  // Show celebration when water goal is first achieved
  useEffect(() => {
    if (
      waterStats.goalMet &&
      !prevGoalMetRef.current &&
      waterStats.totalMl > 0
    ) {
      toast.success("Daily water goal reached! Great job staying hydrated.", {
        icon: "🎉",
        duration: 3000,
      });
    }
    prevGoalMetRef.current = waterStats.goalMet;
  }, [waterStats.goalMet, waterStats.totalMl]);

  const handleWaterAdd = (intake) => {
    if (isWaterBusy) return;
    setWaterActionPending(true);
    addLog.mutate(intake, {
      onSettled: () => {
        setWaterActionPending(false);
      },
    });
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
  };

  const handleWaterDelete = (id) => {
    if (isWaterBusy) return;
    setWaterActionPending(true);
    deleteLog.mutate(id, {
      onSettled: () => {
        setWaterActionPending(false);
      },
    });
  };

  const handleGoalUpdate = (goal) => {
    if (isWaterBusy) return;
    setWaterActionPending(true);
    updateGoal.mutate(goal, {
      onSettled: () => {
        setWaterActionPending(false);
      },
    });
  };

  const handleWakeLog = (payload) => {
    if (isSleepBusy) return;
    setSleepActionPending(true);
    logWakeUp.mutate(payload, {
      onSuccess: () => {
        toast.success("Wake-up logged. Keep the morning streak going ☀️", {
          duration: 2000,
        });
      },
      onSettled: () => {
        setSleepActionPending(false);
      },
    });
  };

  const handleGymLogSubmit = (data) => {
    if (isGymBusy) return;
    setGymActionPending(true);
    addGymLog.mutate(data, {
      onSuccess: () => {
        toast.success("Workout logged! Great job 🔥", {
          duration: 2000,
        });
      },
      onSettled: () => {
        setGymActionPending(false);
      },
    });
  };

  const handleAddExercise = (data) => {
    if (isGymBusy) {
      return Promise.resolve(null);
    }

    setGymActionPending(true);
    return addExercise.mutateAsync(data).finally(() => {
      setGymActionPending(false);
    });
  };

  const handleWorkoutDelete = (id) => {
    if (isGymBusy) return;
    setGymActionPending(true);
    deleteWorkout.mutate(id, {
      onSettled: () => {
        setGymActionPending(false);
      },
    });
  };

  const handleDietSuccess = () => {
    toast.success("Meal logged! 🥗", {
      duration: 2000,
    });
  };

  const hasWaterData = !!waterData;
  const hasSleepData = !!sleepData;
  const hasDietData = !!dietData;

  const formatWakeBadgeTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeStr;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Loading states
  const isAnyLoading = overviewLoading || gymBootstrapLoading;
  const isInitialLoading =
    isAnyLoading &&
    !hasWaterData &&
    !hasSleepData &&
    !hasGymData &&
    !hasDietData;

  // Only show the full-screen wakeup animation briefly on cold starts
  const [showWakeup, setShowWakeup] = useState(false);
  useEffect(() => {
    if (!isInitialLoading) {
      setShowWakeup(false);
      return;
    }

    const delayId = setTimeout(() => setShowWakeup(true), 180);
    return () => {
      clearTimeout(delayId);
    };
  }, [isInitialLoading]);

  return (
    <>
      <WaterAnimation show={showAnimation} />

      {/* Loading Animation */}
      <AnimatePresence>
        {showWakeup && <ServerWakeupAnimation />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-8"
      >
        {/* Diet Section */}
        <Card ref={dietRef}>
          <button
            onClick={() => toggleSection("diet")}
            className="w-full flex items-center justify-between mb-6 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Utensils size={20} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Diet</h2>
            </div>
            <div className="flex items-center gap-2">
              {!hasDietData && overviewLoading ? (
                <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 animate-pulse">
                  <span className="text-xs font-semibold text-green-300">
                    Loading
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-sm font-bold text-green-400">
                    {dietTiming.mealCount || dietData?.totals?.count || 0}
                  </span>
                  <span className="text-xs text-text-secondary ml-0.5">
                    meals
                  </span>
                </div>
              )}
              <motion.div
                animate={{ rotate: expandedSection === "diet" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  size={20}
                  className="text-text-secondary group-hover:text-text-primary transition-colors"
                />
              </motion.div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {expandedSection === "diet" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                {!hasDietData && overviewLoading ? (
                  <div className="py-6 text-sm text-text-secondary">
                    Loading meal insights...
                  </div>
                ) : (
                  <NewDietLogForm onSuccess={handleDietSuccess} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Water Section */}
        <Card ref={waterRef}>
          <button
            onClick={() => toggleSection("water")}
            className="w-full flex items-center justify-between mb-6 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Droplets size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Water</h2>
            </div>
            <div className="flex items-center gap-2">
              {!hasWaterData && overviewLoading ? (
                <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 animate-pulse">
                  <span className="text-xs font-semibold text-primary">
                    Loading
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-sm font-bold text-primary">
                    {waterStats.totalMl}
                  </span>
                  <span className="text-xs text-text-secondary mx-0.5">/</span>
                  <span className="text-xs text-text-secondary">
                    {waterStats.goal}ml
                  </span>
                </div>
              )}
              <motion.div
                animate={{ rotate: expandedSection === "water" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  size={20}
                  className="text-text-secondary group-hover:text-text-primary transition-colors"
                />
              </motion.div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {expandedSection === "water" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                {!hasWaterData && overviewLoading ? (
                  <div className="py-6 text-sm text-text-secondary">
                    Loading hydration data...
                  </div>
                ) : (
                  <>
                    <WaterRing
                      totalMl={waterStats.totalMl}
                      goal={waterStats.goal}
                    />

                    <GoalSetter
                      goal={waterStats.goal}
                      onUpdate={handleGoalUpdate}
                      disabled={isWaterBusy}
                    />

                    {isWaterBusy && (
                      <div className="mt-2 mb-4 flex items-center justify-center gap-2 text-xs text-primary">
                        <Loader2 size={14} className="animate-spin" />
                        Updating water data...
                      </div>
                    )}

                    <div className="mt-6">
                      <QuickAddBar
                        onAdd={handleWaterAdd}
                        disabled={isWaterBusy}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Gym Section */}
        <Card ref={gymRef}>
          <button
            onClick={() => toggleSection("gym")}
            className="w-full flex items-center justify-between mb-6 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Dumbbell size={20} className="text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Gym</h2>
            </div>
            <div className="flex items-center gap-2">
              {!hasGymData && overviewLoading ? (
                <div className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 animate-pulse">
                  <span className="text-xs font-semibold text-orange-300">
                    Loading
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <span className="text-sm font-bold text-orange-400">
                    {weekWorkoutDays}
                  </span>
                  <span className="text-xs text-text-secondary ml-1">
                    {weekWorkoutDays === 1 ? "day" : "days"} this week
                  </span>
                </div>
              )}
              <motion.div
                animate={{ rotate: expandedSection === "gym" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  size={20}
                  className="text-text-secondary group-hover:text-text-primary transition-colors"
                />
              </motion.div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {expandedSection === "gym" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                {!hasGymData && overviewLoading ? (
                  <div className="py-6 text-sm text-text-secondary">
                    Loading workout data...
                  </div>
                ) : gymBootstrapLoading ? (
                  <div className="py-6 text-sm text-text-secondary">
                    Preparing workout tools...
                  </div>
                ) : !todayLog ? (
                  <div className="mb-6">
                    <NewGymLogForm
                      onSubmit={handleGymLogSubmit}
                      disabled={isGymBusy}
                      allExercises={gymExercises || []}
                      userProgram={gymProgram?.workoutTypes || {}}
                      weekHistory={gymWeekHistory || []}
                      onAddExercise={handleAddExercise}
                    />
                    {isGymBusy && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-orange-300">
                        <Loader2 size={14} className="animate-spin" />
                        Saving workout changes...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`bg-navy-800/40 border-l-4 ${
                        todayLog.workoutType === "chestTriceps"
                          ? "border-l-orange-500 border-r border-t border-b border-orange-500/30"
                          : todayLog.workoutType === "backBiceps"
                            ? "border-l-blue-500 border-r border-t border-b border-blue-500/30"
                            : "border-l-purple-500 border-r border-t border-b border-purple-500/30"
                      } rounded-xl p-4`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3
                            className={`text-lg font-semibold capitalize ${
                              todayLog.workoutType === "chestTriceps"
                                ? "text-orange-400"
                                : todayLog.workoutType === "backBiceps"
                                  ? "text-blue-400"
                                  : "text-purple-400"
                            }`}
                          >
                            {todayLog.workoutType
                              .replace("chestTriceps", "Chest & Triceps")
                              .replace("backBiceps", "Back & Biceps")
                              .replace("legsShoulders", "Legs & Shoulders")}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {todayLog.primaryMuscle} +{" "}
                            {todayLog.secondaryMuscle}
                          </p>
                        </div>
                        <button
                          onClick={() => handleWorkoutDelete(todayLog._id)}
                          disabled={isGymBusy}
                          className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isGymBusy ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Loader2 size={14} className="animate-spin" />
                              Deleting...
                            </span>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-1">
                            Primary ({todayLog.primaryMuscle})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {todayLog.primaryExercises.map((ex, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 text-xs bg-primary/20 text-primary rounded-full"
                              >
                                {ex}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-1">
                            Secondary ({todayLog.secondaryMuscle})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {todayLog.secondaryExercises.map((ex, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full"
                              >
                                {ex}
                              </span>
                            ))}
                          </div>
                        </div>

                        {todayLog.duration && (
                          <div className="text-sm text-text-secondary">
                            Duration: {todayLog.duration} minutes
                          </div>
                        )}

                        {todayLog.notes && (
                          <div className="text-sm text-text-secondary">
                            Notes: {todayLog.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Sleep Section */}
        <Card ref={sleepRef}>
          <button
            onClick={() => {
              if (canExpandSleepSection) toggleSection("sleep");
            }}
            className={`w-full flex items-center justify-between mb-6 ${canExpandSleepSection ? "cursor-pointer group" : "cursor-default"}`}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Moon size={20} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Sleep</h2>
            </div>
            <div className="flex items-center gap-2">
              {!hasSleepData && overviewLoading ? (
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 animate-pulse">
                  <span className="text-xs font-semibold text-purple-300">
                    Loading
                  </span>
                </div>
              ) : (
                sleepStats.averageWakeTime && (
                  <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <span className="text-sm font-bold text-purple-400">
                      {formatWakeBadgeTime(sleepStats.averageWakeTime)}
                    </span>
                  </div>
                )
              )}
              {canExpandSleepSection && (
                <motion.div
                  animate={{ rotate: expandedSection === "sleep" ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown
                    size={20}
                    className="text-text-secondary group-hover:text-text-primary transition-colors"
                  />
                </motion.div>
              )}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {canExpandSleepSection && expandedSection === "sleep" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                {!hasSleepData && overviewLoading ? (
                  <div className="py-6 text-sm text-text-secondary">
                    Loading sleep data...
                  </div>
                ) : (
                  <SleepLogForm
                    onLogWake={handleWakeLog}
                    disabled={isSleepBusy}
                  />
                )}
                {isSleepBusy && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-300">
                    <Loader2 size={14} className="animate-spin" />
                    Logging sleep data...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* AI Assistant Trigger */}
        <motion.button
          onClick={() => setIsVoiceModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-2xl p-6 flex items-center justify-between group hover:from-primary/30 hover:to-purple-500/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Sparkles size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-text-primary">Ask AI Assistant</h3>
              <p className="text-sm text-text-secondary">Voice conversation about your health data</p>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={20} className="text-primary rotate-[-90deg]" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </>
  );
}
