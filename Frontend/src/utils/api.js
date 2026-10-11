import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
});

// Include the JWT issued by the API with every authenticated request.
api.interceptors.request.use((config) => {
    try {
        const rawUser = localStorage.getItem('userInfo');
        const userInfo = rawUser ? JSON.parse(rawUser) : null;
        if (userInfo?.token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
    } catch {
        localStorage.removeItem('userInfo');
    }
    return config;
});

// Expired/invalid sessions are cleared centrally. Don't treat a failed login or
// registration as an expired session, because those routes are public.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const isPublicAuthRequest = /\/auth\/(login|register)(?:\?|$)/.test(requestUrl);

        if (status === 401 && !isPublicAuthRequest) {
            localStorage.removeItem('userInfo');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:expired'));
            }
        }

        return Promise.reject(error);
    },
);

export default api;
