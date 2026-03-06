import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGymExercises,
  useGymProgram,
  useUpdateProgram,
  useAddExercise,
} from "../hooks/useGymData";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

const workoutTypes = [
  {
    id: "chestFocus",
    name: "Chest Focus",
    primary: "chest",
    secondary: "triceps",
    color: "from-red-500 to-orange-500",
    icon: "💪",
  },
  {
    id: "tricepsFocus",
    name: "Triceps Focus",
    primary: "triceps",
    secondary: "chest",
    color: "from-orange-500 to-amber-500",
    icon: "🔥",
  },
  {
    id: "backFocus",
    name: "Back Focus",
    primary: "back",
    secondary: "biceps",
    color: "from-blue-500 to-cyan-500",
    icon: "💎",
  },
  {
    id: "bicepsFocus",
    name: "Biceps Focus",
    primary: "biceps",
    secondary: "back",
    color: "from-cyan-500 to-teal-500",
    icon: "⚡",
  },
  {
    id: "legsFocus",
    name: "Legs Focus",
    primary: "legs",
    secondary: "shoulders",
    color: "from-green-500 to-emerald-500",
    icon: "🦵",
  },
  {
    id: "shoulderFocus",
    name: "Shoulders Focus",
    primary: "shoulders",
    secondary: "legs",
    color: "from-emerald-500 to-green-600",
    icon: "🏋️",
  },
];

export default function GymProgramPage() {
  const { data: exercises = [], isLoading: exercisesLoading } =
    useGymExercises();
  const { data: programData, isLoading: programLoading } = useGymProgram();
  const updateProgram = useUpdateProgram();
  const addExercise = useAddExercise();

  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [programState, setProgramState] = useState({});
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: "", muscleGroup: "" });
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState("");

  // Initialize program state when data loads
  useEffect(() => {
    if (programData?.workoutTypes) {
      setProgramState(programData.workoutTypes);
    }
  }, [programData]);

  const getExercisesByMuscle = (muscleGroup) => {
    return exercises.filter((ex) => ex.muscleGroup === muscleGroup);
  };

  const toggleExercise = (workoutId, exerciseName, isPrimary) => {
    setProgramState((prev) => {
      const workout = prev[workoutId] || { primary: [], secondary: [] };
      const key = isPrimary ? "primary" : "secondary";
      const exercises = workout[key] || [];

      const updated = exercises.includes(exerciseName)
        ? exercises.filter((e) => e !== exerciseName)
        : [...exercises, exerciseName];

      return {
        ...prev,
        [workoutId]: {
          ...workout,
          [key]: updated,
        },
      };
    });
  };

  const handleSave = () => {
    updateProgram.mutate(
      { workoutTypes: programState },
      {
        onSuccess: () => {
          toast.success("Training program saved successfully!", {
            icon: "✅",
            duration: 2000,
          });
        },
        onError: () => {
          toast.error("Failed to save program. Please try again.");
        },
      },
    );
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim() || !newExercise.muscleGroup) {
      toast.error("Please enter exercise name and select muscle group");
      return;
    }

    try {
      await addExercise.mutateAsync({
        name: newExercise.name.trim(),
        muscleGroup: newExercise.muscleGroup,
      });
      toast.success("Exercise added successfully!");
      setShowAddExerciseModal(false);
      setNewExercise({ name: "", muscleGroup: "" });
    } catch (error) {
      toast.error("Failed to add exercise");
    }
  };

  const openAddExerciseModal = (muscleGroup) => {
    setCurrentMuscleGroup(muscleGroup);
    setNewExercise({ name: "", muscleGroup });
    setShowAddExerciseModal(true);
  };

  if (exercisesLoading || programLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 px-4 py-8 pb-28 md:pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Training Program
            </h1>
            <p className="text-text-secondary">
              Customize your 6-day double split workout program
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateProgram.isPending}
            className="flex items-center gap-2"
          >
            {updateProgram.isPending ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Save Program
          </Button>
        </div>

        {/* Workout Types */}
        <div className="space-y-4">
          {workoutTypes.map((workout) => {
            const isExpanded = expandedWorkout === workout.id;
            const workoutProgram = programState[workout.id] || {
              primary: [],
              secondary: [],
            };
            const primaryExercises = getExercisesByMuscle(workout.primary);
            const secondaryExercises = getExercisesByMuscle(workout.secondary);

            return (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-navy-800/40 border border-navy-700/30 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedWorkout(isExpanded ? null : workout.id)
                  }
                  className="w-full flex items-center justify-between p-6 hover:bg-navy-800/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-linear-to-br ${workout.color} flex items-center justify-center text-2xl`}
                    >
                      {workout.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {workout.name}
                      </h3>
                      <p className="text-sm text-text-secondary capitalize">
                        Primary: {workout.primary} • Secondary:{" "}
                        {workout.secondary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">
                        {workoutProgram.primary.length +
                          workoutProgram.secondary.length}{" "}
                        exercises
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-text-secondary" size={20} />
                    ) : (
                      <ChevronDown className="text-text-secondary" size={20} />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-navy-700/30 p-6 space-y-6">
                    {/* Primary Exercises */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-medium text-text-primary capitalize">
                          Primary Exercises ({workout.primary})
                        </h4>
                        <button
                          onClick={() => openAddExerciseModal(workout.primary)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus size={14} />
                          Add Exercise
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {primaryExercises.length === 0 ? (
                          <p className="text-sm text-text-secondary">
                            No exercises available for this muscle group
                          </p>
                        ) : (
                          primaryExercises.map((exercise) => (
                            <motion.button
                              key={exercise._id}
                              onClick={() =>
                                toggleExercise(workout.id, exercise.name, true)
                              }
                              whileTap={{ scale: 0.95 }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                workoutProgram.primary.includes(exercise.name)
                                  ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                  : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                              }`}
                            >
                              {exercise.name}
                            </motion.button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Secondary Exercises */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-medium text-text-primary capitalize">
                          Secondary Exercises ({workout.secondary})
                        </h4>
                        <button
                          onClick={() =>
                            openAddExerciseModal(workout.secondary)
                          }
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus size={14} />
                          Add Exercise
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {secondaryExercises.length === 0 ? (
                          <p className="text-sm text-text-secondary">
                            No exercises available for this muscle group
                          </p>
                        ) : (
                          secondaryExercises.map((exercise) => (
                            <motion.button
                              key={exercise._id}
                              onClick={() =>
                                toggleExercise(workout.id, exercise.name, false)
                              }
                              whileTap={{ scale: 0.95 }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                workoutProgram.secondary.includes(exercise.name)
                                  ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                  : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                              }`}
                            >
                              {exercise.name}
                            </motion.button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        title="Add Custom Exercise"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Exercise Name
            </label>
            <input
              type="text"
              value={newExercise.name}
              onChange={(e) =>
                setNewExercise((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Cable Crossover"
              className="w-full px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Muscle Group
            </label>
            <select
              value={newExercise.muscleGroup}
              onChange={(e) =>
                setNewExercise((prev) => ({
                  ...prev,
                  muscleGroup: e.target.value,
                }))
              }
              className="w-full px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select muscle group</option>
              <option value="chest">Chest</option>
              <option value="triceps">Triceps</option>
              <option value="back">Back</option>
              <option value="biceps">Biceps</option>
              <option value="legs">Legs</option>
              <option value="shoulders">Shoulders</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setShowAddExerciseModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExercise}
              disabled={
                !newExercise.name.trim() ||
                !newExercise.muscleGroup ||
                addExercise.isPending
              }
              className="flex-1 flex items-center justify-center gap-2"
            >
              {addExercise.isPending ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Plus size={18} />
              )}
              Add Exercise
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
