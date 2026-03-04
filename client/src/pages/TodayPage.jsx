import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Droplets, Moon, Dumbbell } from "lucide-react";
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

export default function TodayPage() {
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
    sleepScore: 0,
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

  if (waterLoading && sleepLoading && gymLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
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
        {/* Water Tracking Section */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <Droplets size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Water Tracking
            </h2>
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

        {/* Sleep Tracking Section */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Moon size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Sleep Tracking
            </h2>
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

        {/* Gym Tracking Section */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Dumbbell size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Gym Tracking
            </h2>
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
      </motion.div>
    </>
  );
}
