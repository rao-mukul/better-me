import axios from "axios";
import { getLogicalDateKey } from "../utils/dayBoundary";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Helper to get today's date with a 4:00 AM day boundary.
const getTodayDate = () => {
  return getLogicalDateKey();
};

const getTimezoneOffsetMinutes = () => new Date().getTimezoneOffset();

const resolveDateParam = (dateCandidate) => {
  if (typeof dateCandidate === "string" && dateCandidate.trim()) {
    return dateCandidate;
  }
  return getTodayDate();
};

export const waterApi = {
  getToday: () =>
    api
      .get("/water/today", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  getTodaySummary: () =>
    api
      .get("/water/today", {
        params: { date: getTodayDate(), summary: "1" },
      })
      .then((r) => r.data),
  addLog: (data) =>
    api
      .post("/water/log", data, { params: { date: getTodayDate() } })
      .then((r) => r.data),
  deleteLog: (id) => api.delete(`/water/log/${id}`).then((r) => r.data),
  getWeek: () =>
    api
      .get("/water/week", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  getMonth: (year, month) =>
    api.get("/water/month", { params: { year, month } }).then((r) => r.data),
  updateGoal: (goal) =>
    api
      .put("/water/goal", { goal }, { params: { date: getTodayDate() } })
      .then((r) => r.data),
};

export const sleepApi = {
  getToday: () =>
    api
      .get("/sleep/today", {
        params: { date: getTodayDate(), tzOffset: getTimezoneOffsetMinutes() },
      })
      .then((r) => r.data),
  getTodaySummary: () =>
    api
      .get("/sleep/today", {
        params: {
          date: getTodayDate(),
          tzOffset: getTimezoneOffsetMinutes(),
          summary: "1",
        },
      })
      .then((r) => r.data),
  getWeekLogs: () =>
    api
      .get("/sleep/week-logs", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  logCompleteSleep: (data) => api.post("/sleep/log", data).then((r) => r.data),
  deleteSleepLog: (id) => api.delete(`/sleep/log/${id}`).then((r) => r.data),
  getWeek: () =>
    api
      .get("/sleep/week", {
        params: { date: getTodayDate(), tzOffset: getTimezoneOffsetMinutes() },
      })
      .then((r) => r.data),
  getMonth: (year, month) =>
    api
      .get("/sleep/month", {
        params: { year, month, tzOffset: getTimezoneOffsetMinutes() },
      })
      .then((r) => r.data),
  updateTarget: (targetHours) =>
    api
      .put(
        "/sleep/target",
        { targetHours },
        { params: { date: getTodayDate() } },
      )
      .then((r) => r.data),
};

export const gymApi = {
  getTodayLog: (date = getTodayDate()) =>
    api.get("/gym/today", { params: { date } }).then((r) => r.data),
  getLogByDate: (date) =>
    api.get("/gym/today", { params: { date } }).then((r) => r.data),
  logWorkout: (data, date = getTodayDate()) =>
    api.post("/gym/log", data, { params: { date } }).then((r) => r.data),
  deleteWorkout: (id) => api.delete(`/gym/workout/${id}`).then((r) => r.data),
  getExercises: () => api.get("/gym/exercises").then((r) => r.data),
  addExercise: (data) => api.post("/gym/exercises", data).then((r) => r.data),
  deleteExercise: (id) =>
    api.delete(`/gym/exercises/${id}`).then((r) => r.data),
  getProgram: () => api.get("/gym/program").then((r) => r.data),
  updateProgram: (data) => api.put("/gym/program", data).then((r) => r.data),
  getWeekHistory: () =>
    api
      .get("/gym/week-history", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  getWeek: () =>
    api
      .get("/gym/week", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  getMonth: (year, month) =>
    api.get("/gym/month", { params: { year, month } }).then((r) => r.data),
  getStreak: () =>
    api
      .get("/gym/streak", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  getInsights: () =>
    api
      .get("/gym/insights", { params: { date: getTodayDate() } })
      .then((r) => r.data),
  seedExercises: () => api.post("/gym/seed-exercises").then((r) => r.data),
};

export const cleanTimerApi = {
  getAllTimers: () => api.get("/clean-timer").then((r) => r.data),
  createTimer: (data) => api.post("/clean-timer", data).then((r) => r.data),
  resetTimer: (id, data) =>
    api.post(`/clean-timer/reset/${id}`, data).then((r) => r.data),
  updateTimer: (id, data) =>
    api.put(`/clean-timer/${id}`, data).then((r) => r.data),
  deleteTimer: (id) => api.delete(`/clean-timer/${id}`).then((r) => r.data),
  getTimerStats: (id) =>
    api.get(`/clean-timer/stats/${id}`).then((r) => r.data),
};

export const dietApi = {
  // Today's logs
  getToday: (date) =>
    api
      .get("/diet/today", { params: { date: resolveDateParam(date) } })
      .then((r) => r.data),
  getTodaySummary: (date) =>
    api
      .get("/diet/today", {
        params: { date: resolveDateParam(date), summary: "1" },
      })
      .then((r) => r.data),

  // Month data for calendar
  getMonth: (year, month) =>
    api.get("/diet/month", { params: { year, month } }).then((r) => r.data),

  // Meal library
  searchMeals: (query) =>
    api.get("/diet/meals/search", { params: { query } }).then((r) => r.data),
  getPopularMeals: () => api.get("/diet/meals/popular").then((r) => r.data),
  deleteMeal: (id) => api.delete(`/diet/meals/${id}`).then((r) => r.data),

  // AI-powered meal analysis
  analyzeMealImage: (formData) =>
    api
      .post("/diet/analyze-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  // Image cleanup
  cleanupImage: (imageId) =>
    api.post("/diet/cleanup-image", { imageId }).then((r) => r.data),

  // Save meal to library
  saveMeal: (data) => api.post("/diet/meals", data).then((r) => r.data),

  // Log meal
  logMeal: (data) => api.post("/diet/log", data).then((r) => r.data),
  deleteLog: (id) => api.delete(`/diet/log/${id}`).then((r) => r.data),
};

export const todayApi = {
  getOverview: () =>
    api
      .get("/today/overview", {
        params: {
          date: getTodayDate(),
          tzOffset: getTimezoneOffsetMinutes(),
        },
      })
      .then((r) => r.data),
};

export default api;
