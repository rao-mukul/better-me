import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const waterApi = {
  getToday: () => api.get('/water/today').then((r) => r.data),
  addLog: (data) => api.post('/water/log', data).then((r) => r.data),
  deleteLog: (id) => api.delete(`/water/log/${id}`).then((r) => r.data),
  getWeek: () => api.get('/water/week').then((r) => r.data),
  getStreak: () => api.get('/water/streak').then((r) => r.data),
  updateGoal: (goal) => api.put('/water/goal', { goal }).then((r) => r.data),
};

export default api;
