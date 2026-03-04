import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cleanTimerApi } from "../services/api";

export function useAllTimers() {
  return useQuery({
    queryKey: ["cleanTimers"],
    queryFn: cleanTimerApi.getAllTimers,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute to keep timers updated
  });
}

export function useTimerStats(id) {
  return useQuery({
    queryKey: ["cleanTimer", "stats", id],
    queryFn: () => cleanTimerApi.getTimerStats(id),
    enabled: !!id,
  });
}

export function useCreateTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cleanTimerApi.createTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleanTimers"] });
    },
  });
}

export function useResetTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => cleanTimerApi.resetTimer(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleanTimers"] });
      queryClient.invalidateQueries({ queryKey: ["cleanTimer", "stats"] });
    },
  });
}

export function useUpdateTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => cleanTimerApi.updateTimer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleanTimers"] });
    },
  });
}

export function useDeleteTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cleanTimerApi.deleteTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleanTimers"] });
    },
  });
}
