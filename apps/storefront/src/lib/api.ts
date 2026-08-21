import axios, { InternalAxiosRequestConfig } from 'axios';

const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'https://divine-you-web.onrender.com'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shiprocket Shipping Pincode Helper
export const checkPincodeService = async (pincode: string, weight = 0.5) => {
  const response = await API.post('/shipping/check-pincode', { pincode, weight });
  return response.data;
};

export default API;