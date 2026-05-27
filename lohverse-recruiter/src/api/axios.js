import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every request ──────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('recruiter_accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401, redirect to recruiter login on failure ──
let _refreshing = false;
let _queue = [];

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return API(original);
          })
          .catch((e) => Promise.reject(e));
      }

      _refreshing = true;

      try {
        const refreshToken = localStorage.getItem('recruiter_refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        const newToken = res.data.accessToken;
        localStorage.setItem('recruiter_accessToken', newToken);

        _queue.forEach(({ resolve }) => resolve(newToken));
        _queue = [];
        _refreshing = false;

        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch {
        _queue.forEach(({ reject }) => reject(err));
        _queue = [];
        _refreshing = false;

        localStorage.removeItem('recruiter_accessToken');
        localStorage.removeItem('recruiter_refreshToken');
        localStorage.removeItem('recruiter_user');
        // Redirect to recruiter login page
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default API;
