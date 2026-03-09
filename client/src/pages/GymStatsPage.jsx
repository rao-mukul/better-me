import { useState, useEffect, useRef } from "react";
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
  GripVertical,
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
  const [touchDragData, setTouchDragData] = useState(null);
  const [touchDragPosition, setTouchDragPosition] = useState(null);
  const longPressTimerRef = useRef(null);

  // Initialize program state when data loads
  useEffect(() => {
    if (programData?.workoutTypes) {
      setProgramState(programData.workoutTypes);
    }
  }, [programData]);

  const getExercisesByMuscle = (muscleGroup) => {
    return exercises.filter((ex) => ex.muscleGroup === muscleGroup);
  };

  const getSortedExercises = (muscleGroup, workoutId) => {
    const allMuscleExercises = getExercisesByMuscle(muscleGroup);
    const selectedExercises = programState[workoutId]?.primary || [];
    const exerciseOrder =
      programState[workoutId]?.exerciseOrder?.[muscleGroup] || [];

    // Create a map for selected exercises
    const selectedSet = new Set(selectedExercises);

    // Separate selected and unselected
    const selected = [];
    const unselected = [];

    allMuscleExercises.forEach((exercise) => {
      if (selectedSet.has(exercise.name)) {
        selected.push(exercise);
      } else {
        unselected.push(exercise);
      }
    });

    // Sort selected by their order in programState.primary
    const selectedOrderMap = new Map();
    selectedExercises.forEach((name, index) => {
      selectedOrderMap.set(name, index);
    });
    selected.sort((a, b) => {
      const orderA = selectedOrderMap.get(a.name) ?? 999;
      const orderB = selectedOrderMap.get(b.name) ?? 999;
      return orderA - orderB;
    });

    // Sort unselected by exerciseOrder if available, otherwise alphabetically
    if (exerciseOrder.length > 0) {
      const unselectedOrderMap = new Map();
      exerciseOrder.forEach((name, index) => {
        if (!selectedSet.has(name)) {
          unselectedOrderMap.set(name, index);
        }
      });
      unselected.sort((a, b) => {
        const orderA = unselectedOrderMap.get(a.name) ?? 999;
        const orderB = unselectedOrderMap.get(b.name) ?? 999;
        return orderA - orderB;
      });
    }

    // Return selected first, then unselected
    return [...selected, ...unselected];
  };

  const handleDragStart = (e, exercise, workoutId, muscleGroup) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        exerciseName: exercise.name,
        workoutId,
        muscleGroup,
      }),
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetExercise, workoutId) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));

    if (data.workoutId !== workoutId) return;

    const muscleGroup = data.muscleGroup;
    const sourceExerciseName = data.exerciseName;
    const targetExerciseName = targetExercise.name;

    setProgramState((prev) => {
      const workout = prev[workoutId] || {
        primary: [],
        secondary: [],
        exerciseOrder: {},
      };
      const selectedExercises = [...(workout.primary || [])];
      const isSourceSelected = selectedExercises.includes(sourceExerciseName);
      const isTargetSelected = selectedExercises.includes(targetExerciseName);

      // Get all exercises for this muscle group to maintain full order
      const allMuscleExercises = exercises
        .filter((ex) => ex.muscleGroup === muscleGroup)
        .map((ex) => ex.name);

      const exerciseOrder = workout.exerciseOrder || {};
      const currentOrder = exerciseOrder[muscleGroup] || allMuscleExercises;

      const sourceIndex = currentOrder.indexOf(sourceExerciseName);
      const targetIndex = currentOrder.indexOf(targetExerciseName);

      if (sourceIndex === -1 || targetIndex === -1) return prev;

      // Update full exercise order
      const newOrder = [...currentOrder];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceExerciseName);

      // If both are selected, also update selected order
      let newSelectedExercises = selectedExercises;
      if (isSourceSelected && isTargetSelected) {
        const selectedSourceIndex =
          selectedExercises.indexOf(sourceExerciseName);
        const selectedTargetIndex =
          selectedExercises.indexOf(targetExerciseName);
        newSelectedExercises = [...selectedExercises];
        newSelectedExercises.splice(selectedSourceIndex, 1);
        newSelectedExercises.splice(selectedTargetIndex, 0, sourceExerciseName);
      }

      return {
        ...prev,
        [workoutId]: {
          ...workout,
          primary: newSelectedExercises,
          exerciseOrder: {
            ...exerciseOrder,
            [muscleGroup]: newOrder,
          },
        },
      };
    });
  };

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = (e, exerciseName, workoutId, muscleGroup) => {
    const touch = e.touches[0];
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });

    // Start long-press detection (300ms)
    longPressTimerRef.current = setTimeout(() => {
      setTouchDragData({ exerciseName, workoutId, muscleGroup });
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300);
  };

  const handleTouchMove = (e, workoutId) => {
    if (!touchDragData) {
      // Cancel long-press if finger moves before timer completes
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }

    // Scrolling prevented via CSS touch-action: none
    const touch = e.touches[0];
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e, workoutId) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchDragData || touchDragData.workoutId !== workoutId) {
      setTouchDragData(null);
      setTouchDragPosition(null);
      return;
    }

    // Find the element under the touch point
    const touch = e.changedTouches[0];
    const elementAtPoint = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );

    // Find the closest exercise button or container
    let targetElement = elementAtPoint;
    let targetExerciseName = null;

    // Traverse up to find exercise button with data attribute
    while (targetElement && !targetExerciseName) {
      if (targetElement.dataset && targetElement.dataset.exerciseName) {
        targetExerciseName = targetElement.dataset.exerciseName;
        break;
      }
      targetElement = targetElement.parentElement;
    }

    // If we found a valid target, reorder
    if (
      targetExerciseName &&
      targetExerciseName !== touchDragData.exerciseName
    ) {
      const muscleGroup = touchDragData.muscleGroup;
      const sourceExerciseName = touchDragData.exerciseName;

      setProgramState((prev) => {
        const workout = prev[workoutId] || {
          primary: [],
          secondary: [],
          exerciseOrder: {},
        };
        const selectedExercises = [...(workout.primary || [])];
        const isSourceSelected = selectedExercises.includes(sourceExerciseName);
        const isTargetSelected = selectedExercises.includes(targetExerciseName);

        // Get all exercises for this muscle group to maintain full order
        const allMuscleExercises = exercises
          .filter((ex) => ex.muscleGroup === muscleGroup)
          .map((ex) => ex.name);

        const exerciseOrder = workout.exerciseOrder || {};
        const currentOrder = exerciseOrder[muscleGroup] || allMuscleExercises;

        const sourceIndex = currentOrder.indexOf(sourceExerciseName);
        const targetIndex = currentOrder.indexOf(targetExerciseName);

        if (sourceIndex === -1 || targetIndex === -1) return prev;

        // Update full exercise order
        const newOrder = [...currentOrder];
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceExerciseName);

        // If both are selected, also update selected order
        let newSelectedExercises = selectedExercises;
        if (isSourceSelected && isTargetSelected) {
          const selectedSourceIndex =
            selectedExercises.indexOf(sourceExerciseName);
          const selectedTargetIndex =
            selectedExercises.indexOf(targetExerciseName);
          newSelectedExercises = [...selectedExercises];
          newSelectedExercises.splice(selectedSourceIndex, 1);
          newSelectedExercises.splice(
            selectedTargetIndex,
            0,
            sourceExerciseName,
          );
        }

        return {
          ...prev,
          [workoutId]: {
            ...workout,
            primary: newSelectedExercises,
            exerciseOrder: {
              ...exerciseOrder,
              [muscleGroup]: newOrder,
            },
          },
        };
      });
    }

    // Clear touch state
    setTouchDragData(null);
    setTouchDragPosition(null);
  };

  const cancelTouchDrag = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setTouchDragData(null);
    setTouchDragPosition(null);
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
      <div className="flex items-center gap-1.5 sm:gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1 sm:p-1.5 w-fit">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "calendar"
              ? "bg-orange-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={16} className="sm:w-4.5 sm:h-4.5" />
          Calendar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("program")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "program"
              ? "bg-orange-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Dumbbell size={16} className="sm:w-4.5 sm:h-4.5" />
          <span className="hidden xs:inline">Training Program</span>
          <span className="xs:hidden">Program</span>
        </motion.button>
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <GymCalendar />
      ) : (
        /* Training Program View */
        <>
          {/* Header */}
          <div className="flex items-center justify-between bg-navy-800/40 border border-navy-700/30 rounded-xl p-2.5 sm:p-4">
            <h2 className="text-sm sm:text-xl font-bold text-text-primary">
              Select Exercises
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant={isEditMode ? "primary" : "secondary"}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <Edit3 size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {isEditMode ? "Done" : "Edit"}
                </span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProgram.isPending}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                {updateProgram.isPending ? (
                  <Loader size={14} className="animate-spin sm:w-4 sm:h-4" />
                ) : (
                  <Save size={14} className="sm:w-4 sm:h-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          {/* Workout Types */}
          <div className="space-y-2.5 sm:space-y-4">
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
                    className="w-full flex items-center justify-between p-2.5 sm:p-6 hover:bg-navy-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-linear-to-br ${workout.color} flex items-center justify-center text-lg sm:text-2xl shrink-0`}
                      >
                        {workout.icon}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-semibold text-text-primary truncate">
                          {workout.name}
                        </h3>
                        <p className="text-[10px] sm:text-sm text-text-secondary">
                          {workoutProgram.primary.length} exercises
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp
                          size={18}
                          className="text-text-secondary sm:w-5 sm:h-5"
                        />
                      ) : (
                        <ChevronDown
                          size={18}
                          className="text-text-secondary sm:w-5 sm:h-5"
                        />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-navy-700/30 p-2.5 sm:p-6 space-y-3 sm:space-y-6">
                      {/* Primary Muscle Group Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h4 className="text-[10px] sm:text-sm font-semibold text-text-secondary uppercase tracking-wide">
                            {workout.primary}
                            <span className="ml-1 sm:ml-2 text-[9px] sm:text-[10px] normal-case opacity-70">
                              ({workoutProgram.primary.length} selected)
                            </span>
                          </h4>
                          <button
                            onClick={() =>
                              openAddExerciseModal(workout.primary)
                            }
                            className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {getSortedExercises(workout.primary, workout.id)
                            .length === 0 ? (
                            <p className="text-sm text-text-secondary">
                              No exercises available
                            </p>
                          ) : (
                            getSortedExercises(workout.primary, workout.id).map(
                              (exercise) => {
                                const isSelected =
                                  workoutProgram.primary.includes(
                                    exercise.name,
                                  );
                                return (
                                  <div
                                    key={exercise._id}
                                    className={`relative group ${touchDragData?.exerciseName === exercise.name ? "opacity-50" : ""} ${isEditMode ? "touch-none" : ""}`}
                                    draggable={isEditMode}
                                    onDragStart={(e) =>
                                      handleDragStart(
                                        e,
                                        exercise,
                                        workout.id,
                                        workout.primary,
                                      )
                                    }
                                    onDragOver={handleDragOver}
                                    onDrop={(e) =>
                                      handleDrop(e, exercise, workout.id)
                                    }
                                    onTouchStart={
                                      isEditMode
                                        ? (e) =>
                                            handleTouchStart(
                                              e,
                                              exercise.name,
                                              workout.id,
                                              workout.primary,
                                            )
                                        : undefined
                                    }
                                    onTouchMove={
                                      isEditMode
                                        ? (e) => handleTouchMove(e, workout.id)
                                        : undefined
                                    }
                                    onTouchEnd={
                                      isEditMode
                                        ? (e) => handleTouchEnd(e, workout.id)
                                        : undefined
                                    }
                                    onTouchCancel={
                                      isEditMode ? cancelTouchDrag : undefined
                                    }
                                  >
                                    <motion.button
                                      data-exercise-name={exercise.name}
                                      onClick={() =>
                                        toggleExercise(
                                          workout.id,
                                          exercise.name,
                                          true,
                                        )
                                      }
                                      whileTap={{ scale: 0.95 }}
                                      className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-[10px] sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                                        isSelected
                                          ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                          : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                                      }`}
                                    >
                                      {isEditMode && (
                                        <GripVertical
                                          size={12}
                                          className="sm:w-3.5 sm:h-3.5 cursor-grab active:cursor-grabbing opacity-70"
                                        />
                                      )}
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
                                      className={`absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-opacity ${
                                        isEditMode
                                          ? "opacity-100"
                                          : "opacity-0 pointer-events-none"
                                      }`}
                                      title="Delete exercise"
                                    >
                                      <X
                                        size={10}
                                        className="sm:w-3 sm:h-3 text-white"
                                      />
                                    </button>
                                  </div>
                                );
                              },
                            )
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-navy-700/20 my-2 sm:my-0" />

                      {/* Secondary Muscle Group Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h4 className="text-[10px] sm:text-sm font-semibold text-text-secondary uppercase tracking-wide">
                            {workout.secondary}
                            <span className="ml-1 sm:ml-2 text-[9px] sm:text-[10px] normal-case opacity-70">
                              (
                              {
                                workoutProgram.primary.filter((ex) =>
                                  getSortedExercises(
                                    workout.secondary,
                                    workout.id,
                                  ).some((e) => e.name === ex),
                                ).length
                              }{" "}
                              selected)
                            </span>
                          </h4>
                          <button
                            onClick={() =>
                              openAddExerciseModal(workout.secondary)
                            }
                            className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {getSortedExercises(workout.secondary, workout.id)
                            .length === 0 ? (
                            <p className="text-sm text-text-secondary">
                              No exercises available
                            </p>
                          ) : (
                            getSortedExercises(
                              workout.secondary,
                              workout.id,
                            ).map((exercise) => {
                              const isSelected =
                                workoutProgram.primary.includes(exercise.name);
                              return (
                                <div
                                  key={exercise._id}
                                  className={`relative group ${touchDragData?.exerciseName === exercise.name ? "opacity-50" : ""} ${isEditMode ? "touch-none" : ""}`}
                                  draggable={isEditMode}
                                  onDragStart={(e) =>
                                    handleDragStart(
                                      e,
                                      exercise,
                                      workout.id,
                                      workout.secondary,
                                    )
                                  }
                                  onDragOver={handleDragOver}
                                  onDrop={(e) =>
                                    handleDrop(e, exercise, workout.id)
                                  }
                                  onTouchStart={
                                    isEditMode
                                      ? (e) =>
                                          handleTouchStart(
                                            e,
                                            exercise.name,
                                            workout.id,
                                            workout.secondary,
                                          )
                                      : undefined
                                  }
                                  onTouchMove={
                                    isEditMode
                                      ? (e) => handleTouchMove(e, workout.id)
                                      : undefined
                                  }
                                  onTouchEnd={
                                    isEditMode
                                      ? (e) => handleTouchEnd(e, workout.id)
                                      : undefined
                                  }
                                  onTouchCancel={
                                    isEditMode ? cancelTouchDrag : undefined
                                  }
                                >
                                  <motion.button
                                    data-exercise-name={exercise.name}
                                    onClick={() =>
                                      toggleExercise(
                                        workout.id,
                                        exercise.name,
                                        true,
                                      )
                                    }
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-[10px] sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                                      isSelected
                                        ? `bg-linear-to-r ${workout.color} text-white shadow-lg`
                                        : "bg-navy-700/50 text-text-secondary hover:bg-navy-700 border border-navy-600"
                                    }`}
                                  >
                                    {isEditMode && (
                                      <GripVertical
                                        size={12}
                                        className="sm:w-3.5 sm:h-3.5 cursor-grab active:cursor-grabbing opacity-70"
                                      />
                                    )}
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
                                    className={`absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-opacity ${
                                      isEditMode
                                        ? "opacity-100"
                                        : "opacity-0 pointer-events-none"
                                    }`}
                                    title="Delete exercise"
                                  >
                                    <X
                                      size={10}
                                      className="sm:w-3 sm:h-3 text-white"
                                    />
                                  </button>
                                </div>
                              );
                            })
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
