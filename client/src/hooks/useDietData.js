import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../services/api";

export function useDietToday() {
  return useQuery({
    queryKey: ["diet", "today"],
    queryFn: dietApi.getToday,
    refetchOnWindowFocus: true,
  });
}

export function useAddDietLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.addLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
    },
  });
}

export function useDeleteDietLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
    },
  });
}

export function useDietWeek() {
  return useQuery({
    queryKey: ["diet", "week"],
    queryFn: dietApi.getWeek,
  });
}

export function useUpdateDietGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.updateGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
    },
  });
}

export function useDietStreak() {
  return useQuery({
    queryKey: ["diet", "streak"],
    queryFn: dietApi.getStreak,
  });
}
