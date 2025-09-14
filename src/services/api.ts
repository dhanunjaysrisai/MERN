import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Students API
export const studentsApi = {
  getAll: () => api.get('/students'),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  getUnassigned: () => api.get('/students/unassigned/list'),
};

// Teams API
export const teamsApi = {
  getAll: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  update: (id: string, data: any) => api.put(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  assignGuide: (id: string, guideId: string) => api.put(`/teams/${id}/assign-guide`, { guideId }),
};

// Guides API
export const guidesApi = {
  getAll: () => api.get('/guides'),
  getById: (id: string) => api.get(`/guides/${id}`),
  create: (data: any) => api.post('/guides', data),
  update: (id: string, data: any) => api.put(`/guides/${id}`, data),
  delete: (id: string) => api.delete(`/guides/${id}`),
  getAvailable: () => api.get('/guides/available/list'),
  getMyTeams: () => api.get('/guides/my/teams'),
};

// Weekly Logs API
export const weeklyLogsApi = {
  getAll: () => api.get('/weekly-logs'),
  getById: (id: string) => api.get(`/weekly-logs/${id}`),
  create: (data: FormData) => api.post('/weekly-logs', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => api.put(`/weekly-logs/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/weekly-logs/${id}`),
  approve: (id: string, approved: boolean, feedback?: string) => 
    api.put(`/weekly-logs/${id}/approval`, { approved, feedback }),
};

// Documents API
export const documentsApi = {
  getAll: () => api.get('/documents'),
  getById: (id: string) => api.get(`/documents/${id}`),
  upload: (data: FormData) => api.post('/documents', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: any) => api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  download: (id: string) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
};

// Evaluations API
export const evaluationsApi = {
  getAll: () => api.get('/evaluations'),
  getById: (id: string) => api.get(`/evaluations/${id}`),
  create: (data: any) => api.post('/evaluations', data),
  update: (id: string, data: any) => api.put(`/evaluations/${id}`, data),
  delete: (id: string) => api.delete(`/evaluations/${id}`),
  getTeamSummary: (teamId: string) => api.get(`/evaluations/team/${teamId}/summary`),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  uploadProfileImage: (data: FormData) => api.post('/users/profile/image', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data: any) => api.put('/users/change-password', data),
  deactivate: (id: string) => api.put(`/users/${id}/deactivate`),
  activate: (id: string) => api.put(`/users/${id}/activate`),
};

export default api;