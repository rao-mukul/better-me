import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export const waterApi = {
  getToday: () => api.get("/water/today").then((r) => r.data),
  addLog: (data) => api.post("/water/log", data).then((r) => r.data),
  deleteLog: (id) => api.delete(`/water/log/${id}`).then((r) => r.data),
  getWeek: () => api.get("/water/week").then((r) => r.data),
  getMonth: (year, month) =>
    api.get("/water/month", { params: { year, month } }).then((r) => r.data),
  updateGoal: (goal) => api.put("/water/goal", { goal }).then((r) => r.data),
};

export const sleepApi = {
  getToday: () => api.get("/sleep/today").then((r) => r.data),
  startSleep: (data) => api.post("/sleep/start", data).then((r) => r.data),
  completeSleep: (id, data) =>
    api.put(`/sleep/complete/${id}`, data).then((r) => r.data),
  deleteSleepLog: (id) => api.delete(`/sleep/log/${id}`).then((r) => r.data),
  getWeek: () => api.get("/sleep/week").then((r) => r.data),
  getMonth: (year, month) =>
    api.get("/sleep/month", { params: { year, month } }).then((r) => r.data),
  updateTarget: (targetHours) =>
    api.put("/sleep/target", { targetHours }).then((r) => r.data),
};

export const gymApi = {
  getToday: () => api.get("/gym/today").then((r) => r.data),
  startWorkout: (data) => api.post("/gym/start", data).then((r) => r.data),
  updateWorkout: (id, data) =>
    api.put(`/gym/update/${id}`, data).then((r) => r.data),
  completeWorkout: (id, data) =>
    api.put(`/gym/complete/${id}`, data).then((r) => r.data),
  deleteWorkout: (id) => api.delete(`/gym/workout/${id}`).then((r) => r.data),
  getWeek: () => api.get("/gym/week").then((r) => r.data),
  getStreak: () => api.get("/gym/streak").then((r) => r.data),
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
  getToday: () => api.get("/diet/today").then((r) => r.data),
  addLog: (data) => api.post("/diet/log", data).then((r) => r.data),
  deleteLog: (id) => api.delete(`/diet/log/${id}`).then((r) => r.data),
  getWeek: () => api.get("/diet/week").then((r) => r.data),
  updateGoals: (goals) => api.put("/diet/goals", goals).then((r) => r.data),
  getStreak: () => api.get("/diet/streak").then((r) => r.data),
};

export default api;
