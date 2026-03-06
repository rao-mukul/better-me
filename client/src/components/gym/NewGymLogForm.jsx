import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
} from "lucide-react";

const workoutTypes = [
  {
    id: "chestFocus",
    label: "Chest & Triceps",
    primary: "Chest",
    secondary: "Triceps",
    primaryMuscle: "chest",
    secondaryMuscle: "triceps",
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  {
    id: "tricepsFocus",
    label: "Triceps & Chest",
    primary: "Triceps",
    secondary: "Chest",
    primaryMuscle: "triceps",
    secondaryMuscle: "chest",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  {
    id: "backFocus",
    label: "Back & Biceps",
    primary: "Back",
    secondary: "Biceps",
    primaryMuscle: "back",
    secondaryMuscle: "biceps",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "bicepsFocus",
    label: "Biceps & Back",
    primary: "Biceps",
    secondary: "Back",
    primaryMuscle: "biceps",
    secondaryMuscle: "back",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    id: "legsFocus",
    label: "Legs & Shoulders",
    primary: "Legs",
    secondary: "Shoulders",
    primaryMuscle: "legs",
    secondaryMuscle: "shoulders",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  {
    id: "shoulderFocus",
    label: "Shoulders & Legs",
    primary: "Shoulders",
    secondary: "Legs",
    primaryMuscle: "shoulders",
    secondaryMuscle: "legs",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
];

export default function NewGymLogForm({
  onSubmit,
  disabled,
  allExercises = [], // All available exercises from backend
  userProgram = null, // User's training program
  weekHistory = [], // This week's workout types for smart defaults
  onAddExercise, // Callback to add custom exercise
}) {
  const [step, setStep] = useState(1); // 1: workout type, 2: primary exercises, 3: secondary exercises
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [primaryExercises, setPrimaryExercises] = useState([]);
  const [secondaryExercises, setSecondaryExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [addingForMuscle, setAddingForMuscle] = useState(null);

  // Smart suggestion logic: Suggest next workout based on week history
  const getSuggestedWorkout = () => {
    if (!weekHistory || weekHistory.length === 0) {
      // No history, suggest chest focus as default
      return "chestFocus";
    }

    // Get workout types done this week
    const doneWorkouts = weekHistory.map((log) => log.workoutType);

    // Ideal rotation order
    const rotationOrder = [
      "chestFocus",
      "backFocus",
      "legsFocus",
      "tricepsFocus",
      "bicepsFocus",
      "shoulderFocus",
    ];

    // Find first workout in rotation that hasn't been done
    for (const workoutType of rotationOrder) {
      if (!doneWorkouts.includes(workoutType)) {
        return workoutType;
      }
    }

    // All workouts done, suggest the one done least recently
    const lastWorkout = doneWorkouts[doneWorkouts.length - 1];
    const lastIndex = rotationOrder.indexOf(lastWorkout);
    const nextIndex = (lastIndex + 1) % rotationOrder.length;
    return rotationOrder[nextIndex];
  };

  const suggestedWorkout = getSuggestedWorkout();

  const handleWorkoutSelect = (workout) => {
    setSelectedWorkout(workout);

    // Auto-select exercises from user's program if available
    if (userProgram && userProgram[workout.id]) {
      setPrimaryExercises(userProgram[workout.id].primary || []);
      setSecondaryExercises(userProgram[workout.id].secondary || []);
    }

    setStep(2);
  };

  const toggleExercise = (exerciseName, isPrimary) => {
    if (isPrimary) {
      setPrimaryExercises((prev) =>
        prev.includes(exerciseName)
          ? prev.filter((e) => e !== exerciseName)
          : [...prev, exerciseName],
      );
    } else {
      setSecondaryExercises((prev) =>
        prev.includes(exerciseName)
          ? prev.filter((e) => e !== exerciseName)
          : [...prev, exerciseName],
      );
    }
  };

  const handleAddNewExercise = (muscleGroup) => {
    setAddingForMuscle(muscleGroup);
    setShowAddExercise(true);
  };

  const submitNewExercise = async () => {
    if (!newExerciseName.trim() || !addingForMuscle) return;

    try {
      // Call API to add exercise to database
      if (onAddExercise) {
        await onAddExercise({
          name: newExerciseName.trim(),
          muscleGroup: addingForMuscle,
        });
      }

      // Add to selected exercises
      const isPrimary = addingForMuscle === selectedWorkout.primaryMuscle;
      toggleExercise(newExerciseName.trim(), isPrimary);

      setNewExerciseName("");
      setShowAddExercise(false);
      setAddingForMuscle(null);
    } catch (error) {
      console.error("Failed to add exercise:", error);
    }
  };

  const handleSubmit = () => {
    if (!selectedWorkout || primaryExercises.length === 0) return;

    onSubmit({
      workoutType: selectedWorkout.id,
      primaryMuscle: selectedWorkout.primaryMuscle,
      secondaryMuscle: selectedWorkout.secondaryMuscle,
      primaryExercises,
      secondaryExercises,
    });

    // Reset form
    setStep(1);
    setSelectedWorkout(null);
    setPrimaryExercises([]);
    setSecondaryExercises([]);
  };

  const getExercisesForMuscle = (muscleGroup) => {
    return allExercises.filter((ex) => ex.muscleGroup === muscleGroup);
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      {step > 1 && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-success text-white" : "bg-navy-700 text-text-secondary"}`}
          >
            {step > 2 ? <Check size={16} /> : "1"}
          </div>
          <div className="flex-1 h-px bg-navy-700" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-success text-white" : step === 2 ? "bg-primary text-white" : "bg-navy-700 text-text-secondary"}`}
          >
            {step > 3 ? <Check size={16} /> : "2"}
          </div>
          <div className="flex-1 h-px bg-navy-700" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 3 ? "bg-primary text-white" : "bg-navy-700 text-text-secondary"}`}
          >
            3
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Select Workout Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Select Today's Workout
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workoutTypes.map((workout) => {
                const isSuggested = workout.id === suggestedWorkout;
                return (
                  <motion.button
                    key={workout.id}
                    onClick={() => handleWorkoutSelect(workout)}
                    disabled={disabled}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden ${workout.bgColor} border ${isSuggested ? "border-primary" : workout.borderColor} rounded-xl p-4 text-left transition-all hover:shadow-lg disabled:opacity-50 ${isSuggested ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b ${workout.color}`}
                    />
                    {isSuggested && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-primary text-white rounded-full">
                          SUGGESTED
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-text-primary">
                          {workout.label}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                          <span className="font-semibold">
                            {workout.primary}
                          </span>{" "}
                          focus
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-text-secondary" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Primary Muscle Exercises */}
        {step === 2 && selectedWorkout && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="text-sm">Back</span>
              </button>
            </div>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {selectedWorkout.primary} Exercises
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Select the exercises you performed for {selectedWorkout.primary}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {getExercisesForMuscle(selectedWorkout.primaryMuscle).map(
                (exercise) => (
                  <motion.button
                    key={exercise.name}
                    onClick={() => toggleExercise(exercise.name, true)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      primaryExercises.includes(exercise.name)
                        ? `bg-linear-to-r ${selectedWorkout.color} text-white shadow-lg`
                        : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                    }`}
                  >
                    {exercise.name}
                    {primaryExercises.includes(exercise.name) && (
                      <Check size={14} className="inline ml-1" />
                    )}
                  </motion.button>
                ),
              )}

              <button
                onClick={() =>
                  handleAddNewExercise(selectedWorkout.primaryMuscle)
                }
                className="px-4 py-2 rounded-full text-sm font-medium bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-dashed border-navy-600 transition-all"
              >
                <Plus size={14} className="inline mr-1" />
                Add New
              </button>
            </div>

            {/* Add new exercise modal */}
            <AnimatePresence>
              {showAddExercise && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4 p-4 bg-navy-700/30 border border-navy-600 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-text-primary">
                      Add New Exercise
                    </h4>
                    <button
                      onClick={() => {
                        setShowAddExercise(false);
                        setNewExerciseName("");
                      }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-text-primary text-sm focus:outline-none focus:border-primary"
                      onKeyPress={(e) =>
                        e.key === "Enter" && submitNewExercise()
                      }
                    />
                    <button
                      onClick={submitNewExercise}
                      disabled={!newExerciseName.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(3)}
                disabled={primaryExercises.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Secondary Muscle Exercises */}
        {step === 3 && selectedWorkout && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="text-sm">Back</span>
              </button>
            </div>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {selectedWorkout.secondary} Exercises
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Select the exercises you performed for {selectedWorkout.secondary}{" "}
              (optional)
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {getExercisesForMuscle(selectedWorkout.secondaryMuscle).map(
                (exercise) => (
                  <motion.button
                    key={exercise.name}
                    onClick={() => toggleExercise(exercise.name, false)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      secondaryExercises.includes(exercise.name)
                        ? `bg-linear-to-r ${selectedWorkout.color} text-white shadow-lg`
                        : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                    }`}
                  >
                    {exercise.name}
                    {secondaryExercises.includes(exercise.name) && (
                      <Check size={14} className="inline ml-1" />
                    )}
                  </motion.button>
                ),
              )}

              <button
                onClick={() =>
                  handleAddNewExercise(selectedWorkout.secondaryMuscle)
                }
                className="px-4 py-2 rounded-full text-sm font-medium bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-dashed border-navy-600 transition-all"
              >
                <Plus size={14} className="inline mr-1" />
                Add New
              </button>
            </div>

            {/* Add new exercise modal */}
            <AnimatePresence>
              {showAddExercise && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4 p-4 bg-navy-700/30 border border-navy-600 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-text-primary">
                      Add New Exercise
                    </h4>
                    <button
                      onClick={() => {
                        setShowAddExercise(false);
                        setNewExerciseName("");
                      }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-text-primary text-sm focus:outline-none focus:border-primary"
                      onKeyPress={(e) =>
                        e.key === "Enter" && submitNewExercise()
                      }
                    />
                    <button
                      onClick={submitNewExercise}
                      disabled={!newExerciseName.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSubmit}
                disabled={disabled}
                className="flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <Check size={18} />
                Complete Workout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
