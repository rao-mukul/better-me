import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import AppShell from "./components/layout/AppShell";
import TodayPage from "./pages/TodayPage";
import StatsPage from "./pages/StatsPage";
import SleepStatsPage from "./pages/SleepStatsPage";
import GymStatsPage from "./pages/GymStatsPage";
import CleanTimerPage from "./pages/CleanTimerPage";
import CleanTimerStatsPage from "./pages/CleanTimerStatsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1a2540",
              color: "#f0f9ff",
              border: "1px solid rgba(36, 51, 82, 0.5)",
              borderRadius: "12px",
            },
          }}
        />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<TodayPage />} />
            <Route path="/water-stats" element={<StatsPage />} />
            <Route path="/sleep-stats" element={<SleepStatsPage />} />
            <Route path="/gym-stats" element={<GymStatsPage />} />
            <Route path="/clean-timer" element={<CleanTimerPage />} />
            <Route path="/clean-timer/:id" element={<CleanTimerStatsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
