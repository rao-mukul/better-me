import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Droplets,
  Moon,
  Dumbbell,
  Utensils,
  ChevronDown,
  Settings,
} from "lucide-react";
import Card from "../components/ui/Card";
import WaterRing from "../components/water/WaterRing";
import QuickAddBar from "../components/water/QuickAddBar";
import GoalSetter from "../components/water/GoalSetter";
import WaterAnimation from "../components/water/WaterAnimation";
import SleepLogForm from "../components/sleep/SleepLogForm";
import NewGymLogForm from "../components/gym/NewGymLogForm";
import GymLogList from "../components/gym/GymLogList";
import GymCard from "../components/gym/GymCard";
import NewDietLogForm from "../components/diet/NewDietLogForm";
import {
  useWaterToday,
  useAddWaterLog,
  useDeleteWaterLog,
  useUpdateGoal,
} from "../hooks/useWaterData";
import {
  useSleepToday,
  useStartSleep,
  useCompleteSleep,
} from "../hooks/useSleepData";
import {
  useGymToday,
  useAddGymLog,
  useDeleteWorkout,
  useGymExercises,
  useAddExercise,
  useGymProgram,
  useGymWeekHistory,
} from "../hooks/useGymData";
import { useDietToday } from "../hooks/useDietData";

export default function TodayPage() {
  const navigate = useNavigate();
  // Refs for each section card to enable scrolling
  const dietRef = useRef(null);
  const waterRef = useRef(null);
  const gymRef = useRef(null);
  const sleepRef = useRef(null);

  // Track which section is expanded (only one at a time) - default to diet
  const [expandedSection, setExpandedSection] = useState(() => {
    const saved = localStorage.getItem("todayPageExpanded");
    return saved ? saved : "diet";
  });

  // Save to localStorage whenever section changes
  useEffect(() => {
    localStorage.setItem("todayPageExpanded", expandedSection);
  }, [expandedSection]);

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
  const { data: waterData, isLoading: waterLoading } = useWaterToday();
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
  const { data: sleepData, isLoading: sleepLoading } = useSleepToday();
  const startSleep = useStartSleep();
  const completeSleep = useCompleteSleep();
  const activeSleepLog = sleepData?.activeSleepLog || null;
  const sleepStats = sleepData?.stats || {
    totalMinutes: 0,
    targetHours: 8,
    targetMet: false,
    entryCount: 0,
    averageQuality: "none",
  };

  // Gym tracking
  const { data: gymData, isLoading: gymLoading } = useGymToday();
  const addGymLog = useAddGymLog();
  const deleteWorkout = useDeleteWorkout();
  const { data: gymExercises } = useGymExercises();
  const addExercise = useAddExercise();
  const { data: gymProgram } = useGymProgram();
  const { data: gymWeekHistory } = useGymWeekHistory();

  const todayLog = gymData?.log || null;
  const gymStats = gymData?.stats || {
    totalWorkouts: 0,
    totalMinutes: 0,
    muscleGroupsWorked: [],
    totalExercises: 0,
    averageIntensity: "none",
  };

  // Calculate number of unique days with workouts this week
  const weekWorkoutDays = gymWeekHistory
    ? new Set(gymWeekHistory.map((log) => log.date)).size
    : 0;

  // Diet tracking
  const { data: dietData, isLoading: dietLoading } = useDietToday();
  const dietTotals = dietData?.totals || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    count: 0,
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
    addLog.mutate(intake);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
  };

  const handleWaterDelete = (id) => {
    deleteLog.mutate(id);
  };

  const handleGoalUpdate = (goal) => {
    updateGoal.mutate(goal);
  };

  const handleStartSleep = (data) => {
    startSleep.mutate(data, {
      onSuccess: () => {
        toast.success("Sleep tracking started! Sweet dreams 🌙", {
          duration: 2000,
        });
      },
    });
  };

  const handleCompleteSleep = (payload) => {
    completeSleep.mutate(payload, {
      onSuccess: () => {
        toast.success("Sleep logged successfully! Good morning ☀️", {
          duration: 2000,
        });
      },
    });
  };

  const handleGymLogSubmit = (data) => {
    addGymLog.mutate(data, {
      onSuccess: () => {
        toast.success("Workout logged! Great job 🔥", {
          duration: 2000,
        });
      },
    });
  };

  const handleAddExercise = (data) => {
    return addExercise.mutateAsync(data);
  };

  const handleWorkoutDelete = (id) => {
    deleteWorkout.mutate(id);
  };

  const handleDietSuccess = () => {
    toast.success("Meal logged! 🥗", {
      duration: 2000,
    });
  };

  if (waterLoading && sleepLoading && gymLoading && dietLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-80 rounded-2xl bg-navy-800/60" />
        <div className="h-80 rounded-2xl bg-navy-800/60" />
        <div className="h-80 rounded-2xl bg-navy-800/60" />
        <div className="h-80 rounded-2xl bg-navy-800/60" />
      </div>
    );
  }

  return (
    <>
      <WaterAnimation show={showAnimation} />
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
              <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-sm font-bold text-green-400">
                  {dietTotals.calories}
                </span>
                <span className="text-xs text-text-secondary ml-0.5">cal</span>
              </div>
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
                <NewDietLogForm onSuccess={handleDietSuccess} />
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
              <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm font-bold text-primary">
                  {waterStats.totalMl}
                </span>
                <span className="text-xs text-text-secondary mx-0.5">/</span>
                <span className="text-xs text-text-secondary">
                  {waterStats.goal}ml
                </span>
              </div>
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
                <WaterRing
                  totalMl={waterStats.totalMl}
                  goal={waterStats.goal}
                />

                <GoalSetter
                  goal={waterStats.goal}
                  onUpdate={handleGoalUpdate}
                  disabled={updateGoal.isPending}
                />

                <div className="mt-6">
                  <QuickAddBar
                    onAdd={handleWaterAdd}
                    disabled={addLog.isPending}
                  />
                </div>
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
              <div className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <span className="text-sm font-bold text-orange-400">
                  {weekWorkoutDays}
                </span>
                <span className="text-xs text-text-secondary ml-1">
                  {weekWorkoutDays === 1 ? "day" : "days"} this week
                </span>
              </div>
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
                <div className="mb-4">
                  <button
                    onClick={() => navigate("/gym-program")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800/40 hover:bg-navy-800/60 border border-navy-700/30 hover:border-primary/30 rounded-lg text-sm text-text-secondary hover:text-primary transition-all"
                  >
                    <Settings size={16} />
                    Customize Training Program
                  </button>
                </div>

                {!todayLog ? (
                  <div className="mb-6">
                    <NewGymLogForm
                      onSubmit={handleGymLogSubmit}
                      disabled={addGymLog.isPending}
                      allExercises={gymExercises || []}
                      userProgram={gymProgram?.workoutTypes || {}}
                      weekHistory={gymWeekHistory || []}
                      onAddExercise={handleAddExercise}
                    />
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
                          disabled={deleteWorkout.isPending}
                          className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Delete
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

                    {gymStats.totalWorkouts > 0 && <GymCard stats={gymStats} />}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Sleep Section */}
        <Card ref={sleepRef}>
          <button
            onClick={() => toggleSection("sleep")}
            className="w-full flex items-center justify-between mb-6 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Moon size={20} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Sleep</h2>
            </div>
            <div className="flex items-center gap-2">
              {sleepStats.totalMinutes > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <span className="text-sm font-bold text-purple-400">
                    {(sleepStats.totalMinutes / 60).toFixed(1)}h
                  </span>
                </div>
              )}
              <motion.div
                animate={{ rotate: expandedSection === "sleep" ? 180 : 0 }}
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
            {expandedSection === "sleep" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <SleepLogForm
                  activeSleepLog={activeSleepLog}
                  onStartSleep={handleStartSleep}
                  onCompleteSleep={handleCompleteSleep}
                  disabled={startSleep.isPending || completeSleep.isPending}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </>
  );
}
