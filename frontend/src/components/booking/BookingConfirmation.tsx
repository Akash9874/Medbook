import { useState, useEffect } from 'react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { FiCheck, FiClock, FiAlertCircle, FiCalendar, FiUser, FiDollarSign } from 'react-icons/fi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Booking, Doctor, Slot } from '../../types';

interface BookingConfirmationProps {
  booking: Booking;
  doctor: Doctor;
  slot: Slot;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function BookingConfirmation({
  booking,
  doctor,
  slot,
  onConfirm,
  onCancel,
  isLoading,
}: BookingConfirmationProps) {
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!booking.expires_at) return;

    const updateTimer = () => {
      const remaining = differenceInSeconds(parseISO(booking.expires_at!), new Date());
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking.expires_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (booking.status === 'CONFIRMED') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Booking Confirmed!</h3>
        <p className="text-slate-500 mb-6">Your appointment has been successfully booked.</p>
        
        <div className="bg-slate-50 rounded-xl p-4 text-left max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <FiCalendar className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-sm text-slate-500">Date & Time</p>
              <p className="font-medium text-slate-900">
                {format(parseISO(slot.start_time), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-primary-600 font-medium">
                {format(parseISO(slot.start_time), 'h:mm a')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiUser className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-sm text-slate-500">Doctor</p>
              <p className="font-medium text-slate-900">{doctor.name}</p>
              <p className="text-sm text-slate-500">{doctor.specialization}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired || booking.status === 'FAILED') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Booking Expired</h3>
        <p className="text-slate-500 mb-6">
          The booking window has expired. Please try booking again.
        </p>
        <button onClick={onCancel} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          timeRemaining < 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          <FiClock className="w-4 h-4" />
          Confirm within {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-5 space-y-4">
        <h4 className="font-semibold text-slate-900">Appointment Details</h4>
        
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <FiUser className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Doctor</p>
              <p className="font-medium text-slate-900">{doctor.name}</p>
              <p className="text-sm text-slate-500">{doctor.specialization}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <FiCalendar className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Date & Time</p>
              <p className="font-medium text-slate-900">
                {format(parseISO(slot.start_time), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-primary-600 font-medium">
                {format(parseISO(slot.start_time), 'h:mm a')} - {format(parseISO(slot.end_time), 'h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <FiDollarSign className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Consultation Fee</p>
              <p className="font-medium text-slate-900">${doctor.consultation_fee}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Confirming...
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
}

