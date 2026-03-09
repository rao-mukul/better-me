import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../services/api";

export function useDietToday() {
  return useQuery({
    queryKey: ["diet", "today"],
    queryFn: dietApi.getToday,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: true,
  });
}

export function useDietMonth(year, month) {
  return useQuery({
    queryKey: ["diet", "month", year, month],
    queryFn: () => dietApi.getMonth(year, month),
    enabled: !!year && !!month,
  });
}

export function useSearchMeals(query) {
  return useQuery({
    queryKey: ["diet", "search", query],
    queryFn: () => dietApi.searchMeals(query),
    enabled: !!query && query.length >= 2,
  });
}

export function usePopularMeals() {
  return useQuery({
    queryKey: ["diet", "popular"],
    queryFn: dietApi.getPopularMeals,
    staleTime: 300000, // Consider data fresh for 5min
  });
}

export function useAnalyzeMealImage() {
  return useMutation({
    mutationFn: dietApi.analyzeMealImage,
  });
}

export function useGetMealNutrition() {
  return useMutation({
    mutationFn: dietApi.getMealNutrition,
  });
}

export function useSaveMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.saveMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet", "popular"] });
      queryClient.invalidateQueries({ queryKey: ["diet", "search"] });
    },
  });
}

export function useLogMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.logMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet", "today"] });
      queryClient.invalidateQueries({ queryKey: ["diet", "popular"] });
    },
  });
}

export function useDeleteDietLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet", "today"] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietApi.deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
    },
  });
}
