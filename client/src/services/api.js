import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // Handle Rate Limiting globally
      if (status === 429) {
        toast.error('Too many requests. Please try again later.');
      }
      
      // Handle Service Unavailable (e.g., Redis down & DB failing) globally
      // Skip the global toast for health checks since Home.jsx handles it
      if (status === 503 && !error.config.url.includes('/health')) {
        toast.error('Service temporarily unavailable.');
      }
    }
    
    // Pass the error down so React Query and components can still catch it
    return Promise.reject(error);
  }
);

export default api;
