import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Something went wrong talking to the server';
    return Promise.reject(new Error(message));
  }
);

export default {
  analyze: (data) => client.post('/analyze', data),
  getTrainingSamples: (params) => client.get('/training/samples', { params }),
  validateTraining: (data) => client.post('/training/validate', data),
  getStats: () => client.get('/stats'),
  reportPhishing: (data) => client.post('/report', data),
  getBlacklist: () => client.get('/blacklist'),
};
