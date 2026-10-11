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
        // Clear malformed local state rather than failing every API request.
        localStorage.removeItem('userInfo');
    }
    return config;
});

export default api;
