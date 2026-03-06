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
  // Track which section is opened in detail view (null = grid view)
  const [detailView, setDetailView] = useState(null);

  const openDetail = (section) => {
    setDetailView(section);
  };

  const closeDetail = () => {
    setDetailView(null);
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
      <div className="grid grid-cols-2 gap-4 sm:gap-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-navy-800/60" />
        <div className="h-40 rounded-2xl bg-navy-800/60" />
        <div className="h-40 rounded-2xl bg-navy-800/60" />
        <div className="h-40 rounded-2xl bg-navy-800/60" />
      </div>
    );
  }

  const features = [
    {
      id: "water",
      name: "Water",
      icon: Droplets,
      color: "primary",
      bgColor: "bg-primary/20",
      iconColor: "text-primary",
      current: waterStats.totalMl,
      goal: waterStats.goal,
      unit: "ml",
      progress: (waterStats.totalMl / waterStats.goal) * 100,
    },
    {
      id: "sleep",
      name: "Sleep",
      icon: Moon,
      color: "purple",
      bgColor: "bg-purple-500/20",
      iconColor: "text-purple-400",
      current: (sleepStats.totalMinutes / 60).toFixed(1),
      goal: sleepStats.targetHours,
      unit: "h",
      progress: (sleepStats.totalMinutes / (sleepStats.targetHours * 60)) * 100,
    },
    {
      id: "gym",
      name: "Gym",
      icon: Dumbbell,
      color: "orange",
      bgColor: "bg-orange-500/20",
      iconColor: "text-orange-400",
      current: gymStats.totalWorkouts,
      goal: null,
      unit: gymStats.totalWorkouts === 1 ? "workout" : "workouts",
      progress: gymStats.totalWorkouts > 0 ? 100 : 0,
    },
    {
      id: "diet",
      name: "Diet",
      icon: Utensils,
      color: "green",
      bgColor: "bg-green-500/20",
      iconColor: "text-green-400",
      current: dietStats.totalCalories,
      goal: dietStats.calorieGoal,
      unit: "cal",
      progress: (dietStats.totalCalories / dietStats.calorieGoal) * 100,
    },
  ];

  // Get progress bar color based on feature
  const getProgressBarClass = (featureId) => {
    switch (featureId) {
      case "water":
        return "bg-linear-to-r from-primary to-blue-400";
      case "sleep":
        return "bg-linear-to-r from-purple-500 to-purple-400";
      case "gym":
        return "bg-linear-to-r from-orange-500 to-orange-400";
      case "diet":
        return "bg-linear-to-r from-green-500 to-green-400";
      default:
        return "bg-primary";
    }
  };

  // Grid View - show feature cards
  if (!detailView) {
    return (
      <>
        <WaterAnimation show={showAnimation} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4 sm:gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.id}
                onClick={() => openDetail(feature.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative bg-navy-800/40 border border-navy-700/30 rounded-2xl p-4 sm:p-6 text-left hover:border-navy-600/50 transition-all group overflow-hidden"
              >
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon and name */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl ${feature.bgColor}`}
                    >
                      <Icon size={20} className={feature.iconColor} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary">
                      {feature.name}
                    </h3>
                  </div>

                  {/* Stats */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                        {feature.current}
                      </span>
                      <span className="text-xs sm:text-sm text-text-secondary">
                        {feature.unit}
                      </span>
                    </div>

                    {feature.goal !== null && (
                      <>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-navy-700/40 rounded-full overflow-hidden mb-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(feature.progress, 100)}%`,
                            }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`h-full ${getProgressBarClass(feature.id)}`}
                          />
                        </div>
                        <p className="text-xs text-text-secondary">
                          Goal: {feature.goal} {feature.unit}
                        </p>
                      </>
                    )}

                    {feature.goal === null && (
                      <p className="text-xs text-text-secondary">
                        {gymStats.totalMinutes} mins total
                      </p>
                    )}
                  </div>

                  {/* Tap hint */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs text-text-secondary bg-navy-900/80 px-2 py-1 rounded">
                      Open
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </>
    );
  }

  // Detail View - show full details for selected feature
  return (
    <>
      <WaterAnimation show={showAnimation} />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={closeDetail}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ChevronDown size={20} className="rotate-90" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Water Detail View */}
        {detailView === "water" && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary/20">
                <Droplets size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Water Tracking
              </h2>
              <span className="text-sm text-text-secondary ml-auto">
                {waterStats.totalMl}ml / {waterStats.goal}ml
              </span>
            </div>

            <WaterRing totalMl={waterStats.totalMl} goal={waterStats.goal} />

            <GoalSetter
              goal={waterStats.goal}
              onUpdate={handleGoalUpdate}
              disabled={updateGoal.isPending}
            />

            <div className="mt-6 mb-6">
              <QuickAddBar onAdd={handleWaterAdd} disabled={addLog.isPending} />
            </div>

            <IntakeList logs={logs} onDelete={handleWaterDelete} />
          </Card>
        )}

        {/* Sleep Detail View */}
        {detailView === "sleep" && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Moon size={20} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Sleep Tracking
              </h2>
              <span className="text-sm text-text-secondary ml-auto">
                {(sleepStats.totalMinutes / 60).toFixed(1)}h /{" "}
                {sleepStats.targetHours}h
              </span>
            </div>

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
          </Card>
        )}

        {/* Gym Detail View */}
        {detailView === "gym" && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Dumbbell size={20} className="text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Gym Tracking
              </h2>
              <span className="text-sm text-text-secondary ml-auto">
                {gymStats.totalWorkouts} workout
                {gymStats.totalWorkouts !== 1 ? "s" : ""}
              </span>
            </div>

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
          </Card>
        )}

        {/* Diet Detail View */}
        {detailView === "diet" && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Utensils size={20} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Diet Tracking
              </h2>
              <span className="text-sm text-text-secondary ml-auto">
                {dietStats.totalCalories}cal / {dietStats.calorieGoal}cal
              </span>
            </div>

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
          </Card>
        )}
      </motion.div>
    </>
  );
}
