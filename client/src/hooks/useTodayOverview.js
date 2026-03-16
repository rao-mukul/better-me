import { useQuery } from "@tanstack/react-query";
import { todayApi } from "../services/api";

export function useTodayOverview() {
  return useQuery({
    queryKey: ["today", "overview"],
    queryFn: todayApi.getOverview,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
