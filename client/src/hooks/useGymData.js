import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "../services/api";

export function useGymToday() {
  return useQuery({
    queryKey: ["gym", "today"],
    queryFn: gymApi.getTodayLog,
    refetchOnWindowFocus: true,
  });
}

export function useAddGymLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.logWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "today"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "week-history"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "today"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "week-history"] });
    },
  });
}

export function useGymExercises() {
  return useQuery({
    queryKey: ["gym", "exercises"],
    queryFn: gymApi.getExercises,
  });
}

export function useAddExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.addExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] });
    },
  });
}

export function useGymProgram() {
  return useQuery({
    queryKey: ["gym", "program"],
    queryFn: gymApi.getProgram,
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.updateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "program"] });
    },
  });
}

export function useGymWeekHistory() {
  return useQuery({
    queryKey: ["gym", "week-history"],
    queryFn: gymApi.getWeekHistory,
  });
}

export function useGymWeek() {
  return useQuery({
    queryKey: ["gym", "week"],
    queryFn: gymApi.getWeek,
  });
}

export function useGymStreak() {
  return useQuery({
    queryKey: ["gym", "streak"],
    queryFn: gymApi.getStreak,
  });
}

export function useGymInsights() {
  return useQuery({
    queryKey: ["gym", "insights"],
    queryFn: gymApi.getInsights,
    refetchOnWindowFocus: true,
  });
}

export function useGymMonth(year, month) {
  return useQuery({
    queryKey: ["gym", "month", year, month],
    queryFn: () => gymApi.getMonth(year, month),
    enabled: !!year && !!month,
  });
}
