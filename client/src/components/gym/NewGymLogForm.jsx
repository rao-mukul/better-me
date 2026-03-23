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
    id: "chestTriceps",
    label: "Chest & Triceps",
    primary: "Chest",
    secondary: "Triceps",
    primaryMuscle: "chest",
    secondaryMuscle: "triceps",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    solidColor: "bg-orange-500",
  },
  {
    id: "backBiceps",
    label: "Back & Biceps",
    primary: "Back",
    secondary: "Biceps",
    primaryMuscle: "back",
    secondaryMuscle: "biceps",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    solidColor: "bg-blue-500",
  },
  {
    id: "legsShoulders",
    label: "Legs & Shoulders",
    primary: "Legs",
    secondary: "Shoulders",
    primaryMuscle: "legs",
    secondaryMuscle: "shoulders",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    solidColor: "bg-purple-500",
  },
];

const configMapping = {
  chestTriceps: {
    first: "chestTriceps",
    second: "tricepsChest",
  },
  backBiceps: {
    first: "backBiceps",
    second: "bicepsBack",
  },
  legsShoulders: {
    first: "legsShoulders",
    second: "shouldersLegs",
  },
};

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

  const getTimesThisWeek = (workoutId) =>
    weekHistory.filter((log) => log.workoutType === workoutId).length;

  const getEffectiveWorkout = (workout, timesThisWeek) => {
    if (timesThisWeek === 0) return workout;
    return {
      ...workout,
      primary: workout.secondary,
      secondary: workout.primary,
      primaryMuscle: workout.secondaryMuscle,
      secondaryMuscle: workout.primaryMuscle,
    };
  };

  const handleWorkoutSelect = (workout) => {
    // Check if this workout type was done this week
    const timesThisWeek = getTimesThisWeek(workout.id);
    const effectiveWorkout = getEffectiveWorkout(workout, timesThisWeek);

    setSelectedWorkout(effectiveWorkout);

    // Smart exercise pre-selection: map to correct workout configuration
    if (userProgram) {
      const mapping = configMapping[workout.id];
      if (!mapping) {
        setStep(2);
        return;
      }
      const configKey = timesThisWeek === 0 ? mapping.first : mapping.second;
      const exerciseSet = userProgram[configKey]?.primary || [];

      // Split exercises by muscle group
      const primaryMuscleExercises = [];
      const secondaryMuscleExercises = [];

      exerciseSet.forEach((exerciseName) => {
        const exercise = allExercises.find((ex) => ex.name === exerciseName);
        if (exercise) {
          if (exercise.muscleGroup === effectiveWorkout.primaryMuscle) {
            primaryMuscleExercises.push(exerciseName);
          } else if (
            exercise.muscleGroup === effectiveWorkout.secondaryMuscle
          ) {
            secondaryMuscleExercises.push(exerciseName);
          }
        }
      });

      setPrimaryExercises(primaryMuscleExercises);
      setSecondaryExercises(secondaryMuscleExercises);
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
    const filtered = allExercises.filter(
      (ex) => ex.muscleGroup === muscleGroup,
    );

    if (!selectedWorkout) return filtered;

    const isPrimaryMuscle = muscleGroup === selectedWorkout.primaryMuscle;
    const currentSelections = isPrimaryMuscle
      ? primaryExercises
      : secondaryExercises;

    // Keep currently selected exercises at the top in the exact order user picked.
    const currentSelectionOrder = new Map();
    currentSelections.forEach((name, index) => {
      currentSelectionOrder.set(name, index);
    });

    let preselectedOrder = new Map();
    let customOrder = new Map();

    if (userProgram && selectedWorkout) {
      const timesThisWeek = weekHistory.filter(
        (log) => log.workoutType === selectedWorkout.id,
      ).length;

      const mapping = configMapping[selectedWorkout.id];
      if (!mapping) {
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      }
      const configKey = timesThisWeek === 0 ? mapping.first : mapping.second;
      const programConfig = userProgram[configKey] || {};
      const selectedExercises = programConfig.primary || [];
      const exerciseOrder = programConfig.exerciseOrder?.[muscleGroup] || [];

      selectedExercises.forEach((name, index) => {
        preselectedOrder.set(name, index);
      });

      exerciseOrder.forEach((name, index) => {
        customOrder.set(name, index);
      });
    }

    return [...filtered].sort((a, b) => {
      const aIsCurrentSelected = currentSelectionOrder.has(a.name);
      const bIsCurrentSelected = currentSelectionOrder.has(b.name);
      if (aIsCurrentSelected !== bIsCurrentSelected) {
        return aIsCurrentSelected ? -1 : 1;
      }
      if (aIsCurrentSelected && bIsCurrentSelected) {
        return (
          currentSelectionOrder.get(a.name) - currentSelectionOrder.get(b.name)
        );
      }

      const aIsPreselected = preselectedOrder.has(a.name);
      const bIsPreselected = preselectedOrder.has(b.name);
      if (aIsPreselected !== bIsPreselected) {
        return aIsPreselected ? -1 : 1;
      }
      if (aIsPreselected && bIsPreselected) {
        return preselectedOrder.get(a.name) - preselectedOrder.get(b.name);
      }

      const aOrder = customOrder.get(a.name) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = customOrder.get(b.name) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.name.localeCompare(b.name);
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Progress indicator */}
      {step > 1 && (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 2 ? "bg-success text-white" : "bg-navy-700 text-text-secondary"}`}
          >
            {step > 2 ? <Check size={12} className="sm:w-4 sm:h-4" /> : "1"}
          </div>
          <div className="flex-1 h-px bg-navy-700" />
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 3 ? "bg-success text-white" : step === 2 ? "bg-primary text-white" : "bg-navy-700 text-text-secondary"}`}
          >
            {step > 3 ? <Check size={12} className="sm:w-4 sm:h-4" /> : "2"}
          </div>
          <div className="flex-1 h-px bg-navy-700" />
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step === 3 ? "bg-primary text-white" : "bg-navy-700 text-text-secondary"}`}
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
            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">
              Select Today's Workout
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {workoutTypes.map((workout) => {
                const timesThisWeek = getTimesThisWeek(workout.id);
                const effectiveWorkout = getEffectiveWorkout(
                  workout,
                  timesThisWeek,
                );
                const displayLabel = `${effectiveWorkout.primary} & ${effectiveWorkout.secondary}`;
                return (
                  <motion.button
                    key={workout.id}
                    onClick={() => handleWorkoutSelect(workout)}
                    disabled={disabled}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden ${workout.bgColor} border ${workout.borderColor} rounded-lg sm:rounded-xl p-3 sm:p-4 text-left transition-all hover:shadow-lg disabled:opacity-50`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b ${workout.color}`}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-bold text-text-primary">
                          {displayLabel}
                        </p>
                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1">
                          <span className="font-semibold">
                            {effectiveWorkout.primary}
                          </span>{" "}
                          focus
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-text-secondary sm:w-5 sm:h-5"
                      />
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
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 sm:gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Back</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-1.5 sm:mb-2">
              {selectedWorkout.primary} Exercises
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">
              Select the exercises you performed for {selectedWorkout.primary}
            </p>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {getExercisesForMuscle(selectedWorkout.primaryMuscle).map(
                (exercise) => (
                  <motion.button
                    key={exercise.name}
                    onClick={() => toggleExercise(exercise.name, true)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      primaryExercises.includes(exercise.name)
                        ? `bg-linear-to-r ${selectedWorkout.color} text-white shadow-lg`
                        : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                    }`}
                  >
                    {exercise.name}
                    {primaryExercises.includes(exercise.name) && (
                      <Check
                        size={12}
                        className="sm:w-3.5 sm:h-3.5 inline ml-0.5 sm:ml-1"
                      />
                    )}
                  </motion.button>
                ),
              )}

              <button
                onClick={() =>
                  handleAddNewExercise(selectedWorkout.primaryMuscle)
                }
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-dashed border-navy-600 transition-all"
              >
                <Plus
                  size={12}
                  className="sm:w-3.5 sm:h-3.5 inline mr-0.5 sm:mr-1"
                />
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
                  className="mt-3 sm:mt-4 p-3 sm:p-4 bg-navy-700/30 border border-navy-600 rounded-lg sm:rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-text-primary">
                      Add New Exercise
                    </h4>
                    <button
                      onClick={() => {
                        setShowAddExercise(false);
                        setNewExerciseName("");
                      }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-navy-800 border border-navy-600 rounded-lg text-text-primary text-xs sm:text-sm focus:outline-none focus:border-primary"
                      onKeyPress={(e) =>
                        e.key === "Enter" && submitNewExercise()
                      }
                    />
                    <button
                      onClick={submitNewExercise}
                      disabled={!newExerciseName.trim()}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-primary text-xl sm:text-2xl font-bold hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      +
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                onClick={() => setStep(3)}
                disabled={primaryExercises.length === 0}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg text-sm sm:text-base font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight size={16} className="sm:w-4.5 sm:h-4.5" />
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
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 sm:gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Back</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-1.5 sm:mb-2">
              {selectedWorkout.secondary} Exercises
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">
              Select the exercises you performed for {selectedWorkout.secondary}{" "}
              (optional)
            </p>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {getExercisesForMuscle(selectedWorkout.secondaryMuscle).map(
                (exercise) => (
                  <motion.button
                    key={exercise.name}
                    onClick={() => toggleExercise(exercise.name, false)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      secondaryExercises.includes(exercise.name)
                        ? `bg-linear-to-r ${selectedWorkout.color} text-white shadow-lg`
                        : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                    }`}
                  >
                    {exercise.name}
                    {secondaryExercises.includes(exercise.name) && (
                      <Check
                        size={12}
                        className="sm:w-3.5 sm:h-3.5 inline ml-0.5 sm:ml-1"
                      />
                    )}
                  </motion.button>
                ),
              )}

              <button
                onClick={() =>
                  handleAddNewExercise(selectedWorkout.secondaryMuscle)
                }
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-dashed border-navy-600 transition-all"
              >
                <Plus
                  size={12}
                  className="sm:w-3.5 sm:h-3.5 inline mr-0.5 sm:mr-1"
                />
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
                  className="mt-3 sm:mt-4 p-3 sm:p-4 bg-navy-700/30 border border-navy-600 rounded-lg sm:rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-text-primary">
                      Add New Exercise
                    </h4>
                    <button
                      onClick={() => {
                        setShowAddExercise(false);
                        setNewExerciseName("");
                      }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-navy-800 border border-navy-600 rounded-lg text-text-primary text-xs sm:text-sm focus:outline-none focus:border-primary"
                      onKeyPress={(e) =>
                        e.key === "Enter" && submitNewExercise()
                      }
                    />
                    <button
                      onClick={submitNewExercise}
                      disabled={!newExerciseName.trim()}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-primary text-xl sm:text-2xl font-bold hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      +
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                onClick={handleSubmit}
                disabled={disabled}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-success text-white rounded-lg text-sm sm:text-base font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <Check size={16} className="sm:w-4.5 sm:h-4.5" />
                Complete Workout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
