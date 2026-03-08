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
  Edit3,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGymExercises,
  useGymProgram,
  useUpdateProgram,
  useAddExercise,
  useDeleteExercise,
} from "../hooks/useGymData";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

const workoutTypes = [
  {
    id: "chestTriceps",
    name: "Chest & Triceps",
    primary: "chest",
    secondary: "triceps",
    color: "from-red-500 to-orange-500",
    icon: "💪",
  },
  {
    id: "tricepsChest",
    name: "Triceps & Chest",
    primary: "triceps",
    secondary: "chest",
    color: "from-orange-500 to-red-500",
    icon: "🔥",
  },
  {
    id: "backBiceps",
    name: "Back & Biceps",
    primary: "back",
    secondary: "biceps",
    color: "from-blue-500 to-cyan-500",
    icon: "💎",
  },
  {
    id: "bicepsBack",
    name: "Biceps & Back",
    primary: "biceps",
    secondary: "back",
    color: "from-cyan-500 to-blue-500",
    icon: "⚡",
  },
  {
    id: "legsShoulders",
    name: "Legs & Shoulders",
    primary: "legs",
    secondary: "shoulders",
    color: "from-green-500 to-emerald-500",
    icon: "🦵",
  },
  {
    id: "shouldersLegs",
    name: "Shoulders & Legs",
    primary: "shoulders",
    secondary: "legs",
    color: "from-emerald-500 to-green-500",
    icon: "🏋️",
  },
];

export default function GymProgramPage() {
  const { data: exercises = [], isLoading: exercisesLoading } =
    useGymExercises();
  const { data: programData, isLoading: programLoading } = useGymProgram();
  const updateProgram = useUpdateProgram();
  const addExercise = useAddExercise();
  const deleteExercise = useDeleteExercise();

  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [programState, setProgramState] = useState({});
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: "", muscleGroup: "" });
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

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

  const handleDeleteExercise = async (exerciseId, exerciseName) => {
    if (!confirm(`Are you sure you want to delete "${exerciseName}"?`)) {
      return;
    }

    try {
      await deleteExercise.mutateAsync(exerciseId);
      toast.success("Exercise deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete exercise");
    }
  };

  if (exercisesLoading || programLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 px-3 sm:px-4 py-6 sm:py-8 pb-28 md:pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Training Program
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant={isEditMode ? "primary" : "secondary"}
              className="flex items-center gap-1.5 text-sm"
            >
              <Edit3 size={16} />
              <span className="hidden sm:inline">
                {isEditMode ? "Done" : "Edit"}
              </span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProgram.isPending}
              className="flex items-center gap-1.5 text-sm"
            >
              {updateProgram.isPending ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Workout Types */}
        <div className="space-y-4">
          {workoutTypes.map((workout) => {
            const isExpanded = expandedWorkout === workout.id;
            const workoutProgram = programState[workout.id] || {
              primary: [],
              secondary: [],
            };
            // Get exercises for both muscle groups involved in this workout
            const primaryMuscleExercises = getExercisesByMuscle(
              workout.primary,
            );
            const secondaryMuscleExercises = getExercisesByMuscle(
              workout.secondary,
            );
            const allWorkoutExercises = [
              ...primaryMuscleExercises,
              ...secondaryMuscleExercises,
            ];

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
                  className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-navy-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br ${workout.color} flex items-center justify-center text-xl sm:text-2xl shrink-0`}
                    >
                      {workout.icon}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-text-primary truncate">
                        {workout.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-text-secondary">
                        {workoutProgram.primary.length} exercises
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="text-text-secondary" size={20} />
                    ) : (
                      <ChevronDown className="text-text-secondary" size={20} />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-navy-700/30 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        Select Exercises
                      </h4>
                      <button
                        onClick={() => openAddExerciseModal(workout.primary)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Add Exercise</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allWorkoutExercises.length === 0 ? (
                        <p className="text-sm text-text-secondary">
                          No exercises available for this workout
                        </p>
                      ) : (
                        allWorkoutExercises.map((exercise) => (
                          <div key={exercise._id} className="relative group">
                            <motion.button
                              onClick={() =>
                                toggleExercise(workout.id, exercise.name, true)
                              }
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                                workoutProgram.primary.includes(exercise.name)
                                  ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                  : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                              }`}
                            >
                              <span className="text-[10px] opacity-70 uppercase mr-1 sm:mr-1.5 hidden xs:inline">
                                {exercise.muscleGroup.slice(0, 4)}
                              </span>
                              {exercise.name}
                            </motion.button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExercise(
                                  exercise._id,
                                  exercise.name,
                                );
                              }}
                              className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-opacity ${
                                isEditMode
                                  ? "opacity-100"
                                  : "opacity-0 pointer-events-none"
                              }`}
                              title="Delete exercise"
                            >
                              <X size={12} className="text-white" />
                            </button>
                          </div>
                        ))
                      )}
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
