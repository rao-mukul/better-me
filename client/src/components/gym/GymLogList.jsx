import { motion, AnimatePresence } from "framer-motion";
import GymLogItem from "./GymLogItem";

export default function GymLogList({ workouts, onDelete, disabled }) {
  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">
          No completed workouts today
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {workouts.map((workout) => (
          <GymLogItem
            key={workout._id}
            workout={workout}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
