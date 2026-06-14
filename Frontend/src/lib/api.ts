import axios from 'axios';
import { ApiUrl } from './variable';

export const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('Authorization');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
