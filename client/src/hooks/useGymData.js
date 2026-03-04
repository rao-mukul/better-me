import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "../services/api";

export function useGymToday() {
  return useQuery({
    queryKey: ["gym", "today"],
    queryFn: gymApi.getToday,
    refetchOnWindowFocus: true,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.startWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym"] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => gymApi.updateWorkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym"] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => gymApi.completeWorkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gymApi.deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym"] });
    },
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
