import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "../services/api";

export function useGymToday() {
  return useQuery({
    queryKey: ["gym", "today"],
    queryFn: gymApi.getTodayLog,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: true,
  });
}

export function useAddGymLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => {
      if (payload?.data) {
        return gymApi.logWorkout(payload.data, payload.date);
      }
      return gymApi.logWorkout(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "today"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "day"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "month"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "week-history"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "week"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "insights"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "streak"] });
      queryClient.invalidateQueries({ queryKey: ["today", "overview"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym", "today"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "day"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "month"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "week-history"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "week"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "insights"] });
      queryClient.invalidateQueries({ queryKey: ["gym", "streak"] });
      queryClient.invalidateQueries({ queryKey: ["today", "overview"] });
    },
  });
}

export function useGymDay(date) {
  return useQuery({
    queryKey: ["gym", "day", date],
    queryFn: () => gymApi.getLogByDate(date),
    enabled: !!date,
    staleTime: 30000,
  });
}

export function useGymExercises(options = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ["gym", "exercises"],
    queryFn: gymApi.getExercises,
    staleTime: 300000, // Consider data fresh for 5min (rarely changes)
    enabled,
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

export function useGymProgram(options = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ["gym", "program"],
    queryFn: gymApi.getProgram,
    enabled,
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
