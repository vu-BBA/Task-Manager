import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
console.log('API_URL:', API_URL); // Debug: check if VITE_API_URL is loaded

const api = axios.create({
  baseURL: API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(API_URL + '/api/auth/refresh', { refreshToken: refresh });
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr.response?.data || refreshErr.message);
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ────────────────────────────────────────────
export const authAPI = {
  register: (d)  => api.post('/auth/register', d),
  login:    (d)  => api.post('/auth/login', d),
  me:       ()   => api.get('/auth/me'),
  updateMe: (d)  => api.put('/auth/me', d),
  changePassword:(d) => api.put('/auth/password', d),
};

// ── Tasks ────────────────────────────────────────────
export const taskAPI = {
  getAll:   (p)  => api.get('/tasks', { params: p }),
  getToday: ()   => api.get('/tasks/today'),
  getOne:   (id) => api.get(`/tasks/${id}`),
  create:   (d)  => api.post('/tasks', d),
  update:   (id,d) => api.put(`/tasks/${id}`, d),
  delete:   (id) => api.delete(`/tasks/${id}`),
  complete: (id) => api.patch(`/tasks/${id}/complete`),
};

// ── Analytics ────────────────────────────────────────
export const analyticsAPI = {
  overview:   () => api.get('/analytics/overview'),
  byCategory: () => api.get('/analytics/by-category'),
  weekly:     () => api.get('/analytics/weekly-trend'),
  heatmap:    () => api.get('/analytics/daily-heatmap'),
  priority:   () => api.get('/analytics/priority-breakdown'),
};

// ── ML ───────────────────────────────────────────────
export const mlAPI = {
  suggestions:    () => api.get('/ml/suggestions'),
  recurring:      () => api.get('/ml/recurring'),
  productiveHours:() => api.get('/ml/productive-hours'),
};

// ── Templates ────────────────────────────────────────
export const templateAPI = {
  getAll:  ()       => api.get('/templates'),
  create:  (d)      => api.post('/templates', d),
  update:  (id,d)   => api.put(`/templates/${id}`, d),
  delete:  (id)     => api.delete(`/templates/${id}`),
  apply:   (id,d)   => api.post(`/templates/${id}/apply`, d),
};

// ── Admin ────────────────────────────────────────────
export const adminAPI = {
  stats:        () => api.get('/admin/stats'),
  users:        (p) => api.get('/admin/users', { params: p }),
  toggleUser:   (id) => api.patch(`/admin/users/${id}/toggle`),
  deleteUser:   (id) => api.delete(`/admin/users/${id}`),
  createGlobal: (d)  => api.post('/admin/templates', d),
};
