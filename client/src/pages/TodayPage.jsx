import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import WaterRing from '../components/water/WaterRing';
import QuickAddBar from '../components/water/QuickAddBar';
import IntakeList from '../components/water/IntakeList';
import GoalSetter from '../components/water/GoalSetter';
import WaterAnimation from '../components/water/WaterAnimation';
import { useWaterToday, useAddWaterLog, useDeleteWaterLog, useUpdateGoal } from '../hooks/useWaterData';

export default function TodayPage() {
  const { data, isLoading } = useWaterToday();
  const addLog = useAddWaterLog();
  const deleteLog = useDeleteWaterLog();
  const updateGoal = useUpdateGoal();
  const prevGoalMetRef = useRef(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const logs = data?.logs || [];
  const stats = data?.stats || { totalMl: 0, goal: 2500, goalMet: false, entryCount: 0 };

  // Show celebration when goal is first achieved
  useEffect(() => {
    if (stats.goalMet && !prevGoalMetRef.current && stats.totalMl > 0) {
      toast.success('Daily goal reached! Great job staying hydrated.', {
        icon: '🎉',
        duration: 3000,
      });
    }
    prevGoalMetRef.current = stats.goalMet;
  }, [stats.goalMet, stats.totalMl]);

  const handleAdd = (intake) => {
    addLog.mutate(intake);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
  };

  const handleDelete = (id) => {
    deleteLog.mutate(id);
  };

  const handleGoalUpdate = (goal) => {
    updateGoal.mutate(goal);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="w-[200px] h-[200px] rounded-full bg-navy-800/60" />
        <div className="h-4 w-32 rounded bg-navy-800/60" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-24 h-24 rounded-2xl bg-navy-800/60" />
          ))}
        </div>
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
      >
        <WaterRing totalMl={stats.totalMl} goal={stats.goal} />

      <GoalSetter
        goal={stats.goal}
        onUpdate={handleGoalUpdate}
        disabled={updateGoal.isPending}
      />

      <div className="mt-6 mb-6">
        <QuickAddBar onAdd={handleAdd} disabled={addLog.isPending} />
      </div>

        <IntakeList logs={logs} onDelete={handleDelete} />
      </motion.div>
    </>
  );
}
