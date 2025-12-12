import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  User,
  Doctor,
  Slot,
  Booking,
  LoginForm,
  RegisterForm,
  DoctorForm,
  SlotForm,
  BulkSlotForm,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginForm) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterForm) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return response.data.data;
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  },
};

// Doctor API
export const doctorApi = {
  getAll: async (params?: { specialization?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<Doctor[]>>('/doctors', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data.data;
  },

  getSpecializations: async () => {
    const response = await api.get<ApiResponse<string[]>>('/doctors/specializations');
    return response.data.data;
  },

  create: async (data: DoctorForm) => {
    const response = await api.post<ApiResponse<Doctor>>('/doctors', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<DoctorForm>) => {
    const response = await api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/doctors/${id}`);
  },
};

// Slot API
export const slotApi = {
  getAvailable: async (params?: { doctor_id?: string; date?: string }) => {
    const response = await api.get<ApiResponse<Slot[]>>('/slots', { params });
    return response.data.data;
  },

  getByDoctor: async (doctorId: string, params?: { date?: string; available_only?: boolean }) => {
    const response = await api.get<ApiResponse<Slot[]>>(`/slots/doctor/${doctorId}`, { params });
    return response.data.data;
  },

  create: async (data: SlotForm) => {
    const response = await api.post<ApiResponse<Slot>>('/slots', data);
    return response.data.data;
  },

  createBulk: async (data: BulkSlotForm) => {
    const response = await api.post<ApiResponse<{ success: boolean; slot?: Slot; error?: string }[]>>('/slots/bulk', data);
    return response.data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/slots/${id}`);
  },
};

// Booking API
export const bookingApi = {
  create: async (slotId: string) => {
    const response = await api.post<ApiResponse<Booking>>('/bookings', { slot_id: slotId });
    return response.data.data;
  },

  confirm: async (id: string) => {
    const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/confirm`);
    return response.data.data;
  },

  cancel: async (id: string) => {
    await api.patch(`/bookings/${id}/cancel`);
  },

  getMyBookings: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/my', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data.data;
  },

  // Admin only
  getAll: async (params?: { status?: string; doctor_id?: string; date?: string; page?: number }) => {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings', { params });
    return response.data;
  },

  expirePending: async () => {
    const response = await api.post<ApiResponse<{ message: string }>>('/bookings/admin/expire-pending');
    return response.data;
  },
};

export default api;

