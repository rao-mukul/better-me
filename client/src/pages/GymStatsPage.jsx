import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
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
import GymCalendar from "../components/gym/GymCalendar";

const workoutTypes = [
  {
    id: "chestTriceps",
    name: "Chest & Triceps",
    description: "Chest focus, triceps secondary",
    primary: "chest",
    secondary: "triceps",
    color: "from-red-500 to-orange-500",
    icon: "💪",
  },
  {
    id: "tricepsChest",
    name: "Triceps & Chest",
    description: "Triceps focus, chest secondary",
    primary: "triceps",
    secondary: "chest",
    color: "from-orange-500 to-red-500",
    icon: "🔥",
  },
  {
    id: "backBiceps",
    name: "Back & Biceps",
    description: "Back focus, biceps secondary",
    primary: "back",
    secondary: "biceps",
    color: "from-blue-500 to-cyan-500",
    icon: "💎",
  },
  {
    id: "bicepsBack",
    name: "Biceps & Back",
    description: "Biceps focus, back secondary",
    primary: "biceps",
    secondary: "back",
    color: "from-cyan-500 to-blue-500",
    icon: "⚡",
  },
  {
    id: "legsShoulders",
    name: "Legs & Shoulders",
    description: "Legs focus, shoulders secondary",
    primary: "legs",
    secondary: "shoulders",
    color: "from-green-500 to-emerald-500",
    icon: "🦵",
  },
  {
    id: "shouldersLegs",
    name: "Shoulders & Legs",
    description: "Shoulders focus, legs secondary",
    primary: "shoulders",
    secondary: "legs",
    color: "from-emerald-500 to-green-500",
    icon: "🏋️",
  },
];

export default function GymStatsPage() {
  const [view, setView] = useState("calendar"); // "calendar" or "program"
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

  if ((exercisesLoading || programLoading) && view === "program") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1.5 w-fit">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "calendar"
              ? "bg-orange-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={18} />
          Calendar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("program")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "program"
              ? "bg-orange-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Dumbbell size={18} />
          Training Program
        </motion.button>
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <GymCalendar />
      ) : (
        /* Training Program View */
        <>
          {/* Header */}
          <div className="flex items-center justify-between bg-navy-800/40 border border-navy-700/30 rounded-xl p-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Training Program
              </h2>
              <p className="text-sm text-text-secondary">
                Configure 6 workout variations - train each muscle group with
                different focus
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant={isEditMode ? "primary" : "secondary"}
                className="flex items-center gap-2"
              >
                <Edit3 size={18} />
                {isEditMode ? "Done" : "Edit"}
              </Button>
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
              const primaryMuscleExercises = getExercisesByMuscle(
                workout.primary,
              );
              const secondaryMuscleExercises = getExercisesByMuscle(
                workout.secondary,
              );

              return (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 10 }}
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
                        <p className="text-sm text-text-secondary">
                          {workout.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-text-secondary">
                          {workoutProgram.primary.length} exercises
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-text-secondary" size={20} />
                      ) : (
                        <ChevronDown
                          className="text-text-secondary"
                          size={20}
                        />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-navy-700/30 p-6 space-y-6">
                      {/* Primary Muscle Group Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                              Primary: {workout.primary}
                            </h4>
                            <span className="text-xs text-text-secondary">
                              (
                              {
                                workoutProgram.primary.filter((ex) =>
                                  primaryMuscleExercises.some(
                                    (e) => e.name === ex,
                                  ),
                                ).length
                              }{" "}
                              selected)
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              openAddExerciseModal(workout.primary)
                            }
                            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            <Plus size={14} />
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {primaryMuscleExercises.length === 0 ? (
                            <p className="text-sm text-text-secondary">
                              No exercises available
                            </p>
                          ) : (
                            primaryMuscleExercises.map((exercise) => (
                              <div
                                key={exercise._id}
                                className="relative group"
                              >
                                <motion.button
                                  onClick={() =>
                                    toggleExercise(
                                      workout.id,
                                      exercise.name,
                                      true,
                                    )
                                  }
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    workoutProgram.primary.includes(
                                      exercise.name,
                                    )
                                      ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                      : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                                  }`}
                                >
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

                      {/* Divider */}
                      <div className="border-t border-navy-700/20" />

                      {/* Secondary Muscle Group Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                              Secondary: {workout.secondary}
                            </h4>
                            <span className="text-xs text-text-secondary">
                              (
                              {
                                workoutProgram.primary.filter((ex) =>
                                  secondaryMuscleExercises.some(
                                    (e) => e.name === ex,
                                  ),
                                ).length
                              }{" "}
                              selected)
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              openAddExerciseModal(workout.secondary)
                            }
                            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            <Plus size={14} />
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {secondaryMuscleExercises.length === 0 ? (
                            <p className="text-sm text-text-secondary">
                              No exercises available
                            </p>
                          ) : (
                            secondaryMuscleExercises.map((exercise) => (
                              <div
                                key={exercise._id}
                                className="relative group"
                              >
                                <motion.button
                                  onClick={() =>
                                    toggleExercise(
                                      workout.id,
                                      exercise.name,
                                      true,
                                    )
                                  }
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    workoutProgram.primary.includes(
                                      exercise.name,
                                    )
                                      ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                      : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                                  }`}
                                >
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
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

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
    </motion.div>
  );
}
