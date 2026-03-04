import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export const waterApi = {
  getToday: () => api.get("/water/today").then((r) => r.data),
  addLog: (data) => api.post("/water/log", data).then((r) => r.data),
  deleteLog: (id) => api.delete(`/water/log/${id}`).then((r) => r.data),
  getWeek: () => api.get("/water/week").then((r) => r.data),
  getStreak: () => api.get("/water/streak").then((r) => r.data),
  updateGoal: (goal) => api.put("/water/goal", { goal }).then((r) => r.data),
};

export const sleepApi = {
  getToday: () => api.get("/sleep/today").then((r) => r.data),
  startSleep: (data) => api.post("/sleep/start", data).then((r) => r.data),
  completeSleep: (id, data) =>
    api.put(`/sleep/complete/${id}`, data).then((r) => r.data),
  deleteSleepLog: (id) => api.delete(`/sleep/log/${id}`).then((r) => r.data),
  getWeek: () => api.get("/sleep/week").then((r) => r.data),
  getStreak: () => api.get("/sleep/streak").then((r) => r.data),
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

export default api;
