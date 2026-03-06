import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Droplets, Moon, Dumbbell, Utensils, ChevronDown } from "lucide-react";
import Card from "../components/ui/Card";
import WaterRing from "../components/water/WaterRing";
import QuickAddBar from "../components/water/QuickAddBar";
import IntakeList from "../components/water/IntakeList";
import GoalSetter from "../components/water/GoalSetter";
import WaterAnimation from "../components/water/WaterAnimation";
import SleepRing from "../components/sleep/SleepRing";
import SleepLogForm from "../components/sleep/SleepLogForm";
import SleepLogList from "../components/sleep/SleepLogList";
import TargetSetter from "../components/sleep/TargetSetter";
import SleepCard from "../components/sleep/SleepCard";
import GymLogForm from "../components/gym/GymLogForm";
import GymLogList from "../components/gym/GymLogList";
import GymCard from "../components/gym/GymCard";
import DietLogForm from "../components/diet/DietLogForm";
import DietLogList from "../components/diet/DietLogList";
import DietCard from "../components/diet/DietCard";
import DietGoalSetter from "../components/diet/GoalSetter";
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
  useDeleteSleepLog,
  useUpdateTarget,
} from "../hooks/useSleepData";
import {
  useGymToday,
  useStartWorkout,
  useUpdateWorkout,
  useCompleteWorkout,
  useDeleteWorkout,
} from "../hooks/useGymData";
import {
  useDietToday,
  useAddDietLog,
  useDeleteDietLog,
  useUpdateDietGoals,
} from "../hooks/useDietData";

export default function TodayPage() {
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
  const deleteSleepLog = useDeleteSleepLog();
  const updateTarget = useUpdateTarget();

  const sleepLogs = sleepData?.logs || [];
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
  const startWorkout = useStartWorkout();
  const updateWorkout = useUpdateWorkout();
  const completeWorkout = useCompleteWorkout();
  const deleteWorkout = useDeleteWorkout();

  const completedWorkouts = gymData?.completedWorkouts || [];
  const activeWorkout = gymData?.activeWorkout || null;
  const gymStats = gymData?.stats || {
    totalWorkouts: 0,
    totalMinutes: 0,
    muscleGroupsWorked: [],
    totalExercises: 0,
    averageIntensity: "none",
  };

  // Diet tracking
  const { data: dietData, isLoading: dietLoading } = useDietToday();
  const addDietLog = useAddDietLog();
  const deleteDietLog = useDeleteDietLog();
  const updateDietGoals = useUpdateDietGoals();

  const dietLogs = dietData?.logs || [];
  const dietStats = dietData?.stats || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
    goalMet: false,
    entryCount: 0,
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

  const handleSleepDelete = (id) => {
    deleteSleepLog.mutate(id);
  };

  const handleTargetUpdate = (targetHours) => {
    updateTarget.mutate(targetHours);
  };

  const handleStartWorkout = (data) => {
    startWorkout.mutate(data, {
      onSuccess: () => {
        toast.success("Workout started! Let's get it 💪", {
          duration: 2000,
        });
      },
    });
  };

  const handleUpdateWorkout = (payload) => {
    updateWorkout.mutate(payload);
  };

  const handleCompleteWorkout = (payload) => {
    completeWorkout.mutate(payload, {
      onSuccess: () => {
        toast.success("Workout completed! Great job 🔥", {
          duration: 2000,
        });
      },
    });
  };

  const handleWorkoutDelete = (id) => {
    deleteWorkout.mutate(id);
  };

  const handleDietAdd = (data) => {
    addDietLog.mutate(data, {
      onSuccess: () => {
        toast.success("Food entry logged! 🥗", {
          duration: 2000,
        });
      },
    });
  };

  const handleDietDelete = (id) => {
    deleteDietLog.mutate(id);
  };

  const handleDietGoalsUpdate = (goals) => {
    updateDietGoals.mutate(goals, {
      onSuccess: () => {
        toast.success("Nutrition goals updated! 🎯", {
          duration: 2000,
        });
      },
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
                  {dietStats.totalCalories}
                </span>
                <span className="text-xs text-text-secondary mx-0.5">/</span>
                <span className="text-xs text-text-secondary">
                  {dietStats.calorieGoal}cal
                </span>
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
                <DietGoalSetter
                  stats={dietStats}
                  onUpdate={handleDietGoalsUpdate}
                  disabled={updateDietGoals.isPending}
                />

                <div className="mb-6">
                  <DietLogForm
                    onAddLog={handleDietAdd}
                    disabled={addDietLog.isPending}
                  />
                </div>

                {dietStats.entryCount > 0 && (
                  <div className="mb-6">
                    <DietCard stats={dietStats} />
                  </div>
                )}

                <DietLogList logs={dietLogs} onDelete={handleDietDelete} />
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

                <div className="mt-6 mb-6">
                  <QuickAddBar
                    onAdd={handleWaterAdd}
                    disabled={addLog.isPending}
                  />
                </div>

                <IntakeList logs={logs} onDelete={handleWaterDelete} />
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
                  {gymStats.totalWorkouts}
                </span>
                <span className="text-xs text-text-secondary ml-1">
                  {gymStats.totalWorkouts === 1 ? "workout" : "workouts"}
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
                <div className="mb-6">
                  <GymLogForm
                    activeWorkout={activeWorkout}
                    onStartWorkout={handleStartWorkout}
                    onUpdateWorkout={handleUpdateWorkout}
                    onCompleteWorkout={handleCompleteWorkout}
                    disabled={
                      startWorkout.isPending ||
                      updateWorkout.isPending ||
                      completeWorkout.isPending
                    }
                  />
                </div>

                {gymStats.totalWorkouts > 0 && (
                  <div className="mb-6">
                    <GymCard stats={gymStats} />
                  </div>
                )}

                <GymLogList
                  workouts={completedWorkouts}
                  onDelete={handleWorkoutDelete}
                  disabled={deleteWorkout.isPending}
                />
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
              <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <span className="text-sm font-bold text-purple-400">
                  {(sleepStats.totalMinutes / 60).toFixed(1)}
                </span>
                <span className="text-xs text-text-secondary mx-0.5">/</span>
                <span className="text-xs text-text-secondary">
                  {sleepStats.targetHours}h
                </span>
              </div>
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
                <SleepRing
                  totalMinutes={sleepStats.totalMinutes}
                  targetHours={sleepStats.targetHours}
                />

                <TargetSetter
                  targetHours={sleepStats.targetHours}
                  onUpdate={handleTargetUpdate}
                  disabled={updateTarget.isPending}
                />

                <div className="mt-6 mb-6">
                  <SleepLogForm
                    activeSleepLog={activeSleepLog}
                    onStartSleep={handleStartSleep}
                    onCompleteSleep={handleCompleteSleep}
                    disabled={startSleep.isPending || completeSleep.isPending}
                  />
                </div>

                {sleepStats.entryCount > 0 && (
                  <div className="mb-6">
                    <SleepCard stats={sleepStats} />
                  </div>
                )}

                <SleepLogList logs={sleepLogs} onDelete={handleSleepDelete} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </>
  );
}
