import axios from 'axios';

const resolvedBaseURL = import.meta.env.VITE_API_BASE_URL?.trim()
    || ((typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8080' : '');

const api = axios.create({
    baseURL: resolvedBaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});
export default api;
//api direct connect to backend
