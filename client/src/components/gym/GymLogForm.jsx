import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Plus, X, Check, Clock } from "lucide-react";
import { format } from "date-fns";

const muscleGroupOptions = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "legs", label: "Legs" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
];

const intensityOptions = [
  { value: "light", label: "Light", emoji: "😌" },
  { value: "moderate", label: "Moderate", emoji: "💪" },
  { value: "intense", label: "Intense", emoji: "🔥" },
];

export default function GymLogForm({
  activeWorkout,
  onStartWorkout,
  onUpdateWorkout,
  onCompleteWorkout,
  disabled,
}) {
  const now = new Date();

  // State for starting workout
  const [showStartForm, setShowStartForm] = useState(false);

  // State for adding exercises
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");

  // State for completing workout
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [intensity, setIntensity] = useState("moderate");
  const [completeNotes, setCompleteNotes] = useState("");

  const handleStartWorkout = () => {
    onStartWorkout({
      startedAt: new Date().toISOString(),
    });
  };

  const handleAddExercise = (e) => {
    e.preventDefault();

    if (!exerciseName || !sets || !activeWorkout) return;

    const newExercise = {
      name: exerciseName,
      sets: parseInt(sets),
      reps: parseInt(reps) || 0,
      weight: parseFloat(weight) || 0,
      notes: exerciseNotes,
    };

    const updatedExercises = [...(activeWorkout.exercises || []), newExercise];

    onUpdateWorkout({
      id: activeWorkout._id,
      data: {
        exercises: updatedExercises,
      },
    });

    // Reset form
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    setExerciseNotes("");
    setShowExerciseForm(false);
  };

  const handleDeleteExercise = (index) => {
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.filter(
      (_, i) => i !== index,
    );

    onUpdateWorkout({
      id: activeWorkout._id,
      data: {
        exercises: updatedExercises,
      },
    });
  };

  const handleCompleteWorkout = (e) => {
    e.preventDefault();

    if (!activeWorkout || selectedMuscleGroups.length === 0) return;

    onCompleteWorkout({
      id: activeWorkout._id,
      data: {
        endedAt: new Date().toISOString(),
        muscleGroups: selectedMuscleGroups,
        intensity,
        notes: completeNotes,
      },
    });

    // Reset form
    setSelectedMuscleGroups([]);
    setIntensity("moderate");
    setCompleteNotes("");
    setShowCompleteForm(false);
  };

  const toggleMuscleGroup = (group) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  // If there's an active workout, show workout in progress
  if (activeWorkout) {
    const startedAtTime = new Date(activeWorkout.startedAt);
    const exercises = activeWorkout.exercises || [];

    // Show complete form
    if (showCompleteForm) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Complete Workout
            </h3>
            <button
              onClick={() => setShowCompleteForm(false)}
              className="p-1 hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleCompleteWorkout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Muscle Groups Worked*
              </label>
              <div className="flex flex-wrap gap-2">
                {muscleGroupOptions.map((group) => (
                  <button
                    key={group.value}
                    type="button"
                    onClick={() => toggleMuscleGroup(group.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedMuscleGroups.includes(group.value)
                        ? "bg-orange-500 text-white"
                        : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Intensity
              </label>
              <div className="flex gap-2">
                {intensityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIntensity(option.value)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      intensity === option.value
                        ? "bg-orange-500 text-white"
                        : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                    }`}
                  >
                    <div className="text-xl mb-1">{option.emoji}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="complete-notes"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Notes (Optional)
              </label>
              <textarea
                id="complete-notes"
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder="How was your workout?"
                className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCompleteForm(false)}
                className="flex-1 px-4 py-2.5 bg-bg-secondary text-text-primary font-medium rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disabled || selectedMuscleGroups.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18} />
                Complete Workout
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Show exercise form
    if (showExerciseForm) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Add Exercise
            </h3>
            <button
              onClick={() => setShowExerciseForm(false)}
              className="p-1 hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleAddExercise} className="space-y-3">
            <div>
              <label
                htmlFor="exercise-name"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Exercise Name*
              </label>
              <input
                id="exercise-name"
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Bench Press"
                className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="sets"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Sets*
                </label>
                <input
                  id="sets"
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  placeholder="3"
                  min="1"
                  className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="reps"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Reps
                </label>
                <input
                  id="reps"
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="10"
                  min="0"
                  className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="weight"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="20"
                  step="0.5"
                  min="0"
                  className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="exercise-notes"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Notes (Optional)
              </label>
              <input
                id="exercise-notes"
                type="text"
                value={exerciseNotes}
                onChange={(e) => setExerciseNotes(e.target.value)}
                placeholder="Form notes, variations, etc."
                className="w-full px-3 py-2 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowExerciseForm(false)}
                className="flex-1 px-4 py-2.5 bg-bg-secondary text-text-primary font-medium rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Add Exercise
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Show active workout card
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Dumbbell size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Workout in progress...
              </p>
              <p className="text-xs text-text-secondary">
                Started at {format(startedAtTime, "h:mm a")}
              </p>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        {exercises.length > 0 && (
          <div className="mb-3 space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-bg-secondary rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {exercise.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {exercise.sets} sets
                    {exercise.reps > 0 && ` × ${exercise.reps} reps`}
                    {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteExercise(index)}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExerciseForm(true)}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Add Exercise
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCompleteForm(true)}
            disabled={disabled || exercises.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            Complete
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // No active workout - show start button or form
  if (showStartForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Start Workout
          </h3>
          <button
            onClick={() => setShowStartForm(false)}
            className="p-1 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          Ready to start your workout? You'll be able to add exercises as you
          go.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowStartForm(false)}
            className="flex-1 px-4 py-2.5 bg-bg-secondary text-text-primary font-medium rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartWorkout}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Dumbbell size={18} />
            Start Now
          </button>
        </div>
      </motion.div>
    );
  }

  // Default: Show start workout button
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowStartForm(true)}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-4"
    >
      <Dumbbell size={20} />
      Start Workout
    </motion.button>
  );
}
