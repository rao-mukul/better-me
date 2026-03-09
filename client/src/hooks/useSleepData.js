import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sleepApi } from "../services/api";

export function useSleepToday() {
  return useQuery({
    queryKey: ["sleep", "today"],
    queryFn: sleepApi.getToday,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: true,
  });
}

export function useSleepWeekLogs() {
  return useQuery({
    queryKey: ["sleep", "week-logs"],
    queryFn: sleepApi.getWeekLogs,
    staleTime: 60000, // Consider data fresh for 1min
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

export function useLogCompleteSleep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sleepApi.logCompleteSleep,
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

export function useSleepMonth(year, month) {
  return useQuery({
    queryKey: ["sleep", "month", year, month],
    queryFn: () => sleepApi.getMonth(year, month),
    enabled: !!year && !!month,
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
