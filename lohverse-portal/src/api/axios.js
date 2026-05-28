import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every request ──────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401, redirect to portal home on failure ──
let _refreshing = false;
let _queue = [];

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Only attempt refresh for 401 errors, not for the refresh call itself
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_refreshing) {
        // Queue other requests until refresh completes
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Call refresh endpoint with refresh token
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        const newToken = res.data.accessToken;
        localStorage.setItem('accessToken', newToken);

        // Process queued requests
        _queue.forEach(({ resolve }) => resolve(newToken));
        _queue = [];
        _refreshing = false;

        // Retry original request
        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch {
        // Refresh failed → clear session and go to portal homepage (not login page)
        _queue.forEach(({ reject }) => reject(err));
        _queue = [];
        _refreshing = false;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to the Lohverse portal home, not the login page
        window.location.href = '/';
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default API;
