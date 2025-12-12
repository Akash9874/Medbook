import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { bookingApi, slotApi } from '../services/api';
import type { Doctor, Slot, Booking } from '../types';

interface BookingState {
  selectedDoctor: Doctor | null;
  selectedSlot: Slot | null;
  currentBooking: Booking | null;
  availableSlots: Slot[];
  userBookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

interface BookingContextType extends BookingState {
  selectDoctor: (doctor: Doctor | null) => void;
  selectSlot: (slot: Slot | null) => void;
  fetchSlots: (doctorId: string, date?: string) => Promise<void>;
  createBooking: () => Promise<Booking>;
  confirmBooking: (bookingId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  fetchUserBookings: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState: BookingState = {
  selectedDoctor: null,
  selectedSlot: null,
  currentBooking: null,
  availableSlots: [],
  userBookings: [],
  isLoading: false,
  error: null,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  const selectDoctor = useCallback((doctor: Doctor | null) => {
    setState(prev => ({
      ...prev,
      selectedDoctor: doctor,
      selectedSlot: null,
      availableSlots: [],
    }));
  }, []);

  const selectSlot = useCallback((slot: Slot | null) => {
    setState(prev => ({ ...prev, selectedSlot: slot }));
  }, []);

  const fetchSlots = useCallback(async (doctorId: string, date?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const slots = await slotApi.getByDoctor(doctorId, { date, available_only: true });
      setState(prev => ({ ...prev, availableSlots: slots, isLoading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch slots';
      setState(prev => ({ ...prev, error: message, isLoading: false }));
    }
  }, []);

  const createBooking = useCallback(async () => {
    if (!state.selectedSlot) {
      throw new Error('No slot selected');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const booking = await bookingApi.create(state.selectedSlot.id);
      setState(prev => ({
        ...prev,
        currentBooking: booking,
        isLoading: false,
      }));
      return booking;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Failed to create booking';
      setState(prev => ({ ...prev, error: message, isLoading: false }));
      throw new Error(message);
    }
  }, [state.selectedSlot]);

  const confirmBooking = useCallback(async (bookingId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const booking = await bookingApi.confirm(bookingId);
      setState(prev => ({
        ...prev,
        currentBooking: booking,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Failed to confirm booking';
      setState(prev => ({ ...prev, error: message, isLoading: false }));
      throw new Error(message);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await bookingApi.cancel(bookingId);
      setState(prev => ({
        ...prev,
        currentBooking: null,
        userBookings: prev.userBookings.map(b =>
          b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b
        ),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Failed to cancel booking';
      setState(prev => ({ ...prev, error: message, isLoading: false }));
      throw new Error(message);
    }
  }, []);

  const fetchUserBookings = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await bookingApi.getMyBookings();
      setState(prev => ({
        ...prev,
        userBookings: response.data,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setState(prev => ({ ...prev, error: message, isLoading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        ...state,
        selectDoctor,
        selectSlot,
        fetchSlots,
        createBooking,
        confirmBooking,
        cancelBooking,
        fetchUserBookings,
        clearError,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

