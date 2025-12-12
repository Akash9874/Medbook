// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'USER';
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Doctor Types
export interface Doctor {
  id: string;
  name: string;
  email?: string;
  specialization: string;
  qualification?: string;
  experience_years: number;
  consultation_fee: number;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  available_slots?: number;
  created_at: string;
}

// Slot Types
export interface Slot {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  doctor_name?: string;
  specialization?: string;
  is_booked?: boolean;
  booking_status?: BookingStatus;
}

// Booking Types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  doctor_id: string;
  status: BookingStatus;
  notes?: string;
  expires_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  created_at: string;
  // Joined fields
  start_time: string;
  end_time: string;
  doctor_name: string;
  specialization: string;
  consultation_fee?: number;
  qualification?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface DoctorForm {
  name: string;
  email?: string;
  specialization: string;
  qualification?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
}

export interface SlotForm {
  doctor_id: string;
  start_time: string;
  end_time: string;
}

export interface BulkSlotForm {
  doctor_id: string;
  date: string;
  slots: { start_time: string; end_time: string }[];
}

