import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Clock, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

const intensityColors = {
  light: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  moderate: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  intense: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
  },
};

export default function GymLogItem({ workout, onDelete, disabled }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startedAt = new Date(workout.startedAt);
  const endedAt = workout.endedAt ? new Date(workout.endedAt) : null;
  const duration =
    workout.duration || (endedAt ? differenceInMinutes(endedAt, startedAt) : 0);

  const intensityStyle =
    intensityColors[workout.intensity] || intensityColors.moderate;

  const handleDelete = () => {
    onDelete(workout._id);
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`border ${intensityStyle.border} rounded-xl p-4 ${intensityStyle.bg}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${intensityStyle.bg}`}>
            <Dumbbell size={18} className={intensityStyle.text} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-text-primary">
                {format(startedAt, "h:mm a")}
              </p>
              {duration > 0 && (
                <>
                  <span className="text-text-secondary">•</span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Clock size={12} />
                    {duration} min
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="capitalize">{workout.intensity}</span>
              {workout.muscleGroups && workout.muscleGroups.length > 0 && (
                <>
                  <span>•</span>
                  <span>{workout.muscleGroups.join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            {showDetails ? (
              <ChevronUp size={16} className="text-text-secondary" />
            ) : (
              <ChevronDown size={16} className="text-text-secondary" />
            )}
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={disabled}
              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-xs bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Details */}
      {showDetails && workout.exercises && workout.exercises.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-border space-y-2"
        >
          <p className="text-xs font-medium text-text-secondary mb-2">
            Exercises ({workout.exercises.length})
          </p>
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="bg-bg-secondary rounded-lg p-2.5">
              <p className="text-sm font-medium text-text-primary mb-0.5">
                {exercise.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span>{exercise.sets} sets</span>
                {exercise.reps > 0 && <span>× {exercise.reps} reps</span>}
                {exercise.weight > 0 && <span>@ {exercise.weight}kg</span>}
              </div>
              {exercise.notes && (
                <p className="text-xs text-text-secondary mt-1 italic">
                  {exercise.notes}
                </p>
              )}
            </div>
          ))}

          {workout.notes && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-text-secondary italic">
                {workout.notes}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
