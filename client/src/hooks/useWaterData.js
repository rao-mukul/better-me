import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterApi } from '../services/api';

export function useWaterToday() {
  return useQuery({
    queryKey: ['water', 'today'],
    queryFn: waterApi.getToday,
    refetchOnWindowFocus: true,
  });
}

export function useAddWaterLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: waterApi.addLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] });
    },
  });
}

export function useDeleteWaterLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: waterApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] });
    },
  });
}

export function useWaterWeek() {
  return useQuery({
    queryKey: ['water', 'week'],
    queryFn: waterApi.getWeek,
  });
}

export function useWaterStreak() {
  return useQuery({
    queryKey: ['water', 'streak'],
    queryFn: waterApi.getStreak,
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: waterApi.updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] });
    },
  });
}
