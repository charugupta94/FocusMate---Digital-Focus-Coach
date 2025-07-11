import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  updateProfile: (data: any) => api.put('/users/profile', data),
  updatePreferences: (data: any) => api.put('/users/preferences', data),
  getStats: () => api.get('/users/stats'),
};

// Sessions API
export const sessionsAPI = {
  create: (data: any) => api.post('/sessions', data),
  complete: (id: string, data: any) => api.put(`/sessions/${id}/complete`, data),
  getAll: (params?: any) => api.get('/sessions', { params }),
  getToday: () => api.get('/sessions/today'),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// Distractions API
export const distractionsAPI = {
  create: (data: any) => api.post('/distractions', data),
  getAll: (params?: any) => api.get('/distractions', { params }),
  getAnalytics: (params?: any) => api.get('/distractions/analytics', { params }),
  update: (id: string, data: any) => api.put(`/distractions/${id}`, data),
  delete: (id: string) => api.delete(`/distractions/${id}`),
};

// Challenges API
export const challengesAPI = {
  create: (data: any) => api.post('/challenges', data),
  getAll: (params?: any) => api.get('/challenges', { params }),
  updateProgress: (id: string, data: any) => api.put(`/challenges/${id}/progress`, data),
  updateStatus: (id: string, data: any) => api.put(`/challenges/${id}/status`, data),
  delete: (id: string) => api.delete(`/challenges/${id}`),
};

// Journal API
export const journalAPI = {
  create: (data: any) => api.post('/journal', data),
  getAll: (params?: any) => api.get('/journal', { params }),
  getAnalytics: (params?: any) => api.get('/journal/analytics', { params }),
  update: (id: string, data: any) => api.put(`/journal/${id}`, data),
  delete: (id: string) => api.delete(`/journal/${id}`),
};

// Badges API
export const badgesAPI = {
  getAll: () => api.get('/badges'),
  getUserBadges: () => api.get('/badges/user'),
  checkBadges: () => api.post('/badges/check'),
};