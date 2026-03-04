import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sleepApi } from "../services/api";

export function useSleepToday() {
  return useQuery({
    queryKey: ["sleep", "today"],
    queryFn: sleepApi.getToday,
    refetchOnWindowFocus: true,
  });
}

export function useStartSleep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sleepApi.startSleep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
    },
  });
}

export function useCompleteSleep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => sleepApi.completeSleep(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
    },
  });
}

export function useDeleteSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sleepApi.deleteSleepLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
    },
  });
}

export function useSleepWeek() {
  return useQuery({
    queryKey: ["sleep", "week"],
    queryFn: sleepApi.getWeek,
  });
}

export function useSleepStreak() {
  return useQuery({
    queryKey: ["sleep", "streak"],
    queryFn: sleepApi.getStreak,
  });
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sleepApi.updateTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
    },
  });
}
