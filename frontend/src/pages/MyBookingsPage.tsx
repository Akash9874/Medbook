import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { FiCalendar, FiClock, FiUser, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useBooking } from '../context/BookingContext';
import { PageLoader } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { Booking, BookingStatus } from '../types';

const statusConfig: Record<BookingStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pending Confirmation',
    className: 'badge-warning',
    icon: <FiClock className="w-3 h-3" />,
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'badge-success',
    icon: <FiCheck className="w-3 h-3" />,
  },
  FAILED: {
    label: 'Expired',
    className: 'badge-danger',
    icon: <FiAlertCircle className="w-3 h-3" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'badge-danger',
    icon: <FiX className="w-3 h-3" />,
  },
};

export function MyBookingsPage() {
  const { userBookings, isLoading, fetchUserBookings, cancelBooking } = useBooking();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = userBookings.filter((booking) => {
    const appointmentDate = parseISO(booking.start_time);
    const isUpcoming = !isPast(appointmentDate) && ['PENDING', 'CONFIRMED'].includes(booking.status);
    
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'past') return !isUpcoming || ['FAILED', 'CANCELLED'].includes(booking.status);
    return true;
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">
          My Appointments
        </h1>
        <p className="text-slate-500">Manage your upcoming and past appointments</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={<FiCalendar className="w-8 h-8" />}
          title={filter === 'upcoming' ? 'No upcoming appointments' : 'No appointments found'}
          description={
            filter === 'upcoming'
              ? "You don't have any scheduled appointments"
              : 'Your appointment history will appear here'
          }
          action={
            <Link to="/" className="btn-primary">
              Book an Appointment
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancelBooking}
              isCancelling={cancellingId === booking.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const status = statusConfig[booking.status];
  const appointmentDate = parseISO(booking.start_time);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status) && !isPast(appointmentDate);

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
            <FiUser className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{booking.doctor_name}</h3>
            <p className="text-sm text-primary-600">{booking.specialization}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                {format(appointmentDate, 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-4 h-4" />
                {format(appointmentDate, 'h:mm a')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`${status.className} flex items-center gap-1`}>
            {status.icon}
            {status.label}
          </span>
          
          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
              className="btn-ghost text-sm text-red-600 hover:bg-red-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      {booking.consultation_fee && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
          <span className="text-slate-500">Consultation Fee</span>
          <span className="font-medium text-slate-900">${booking.consultation_fee}</span>
        </div>
      )}
    </div>
  );
}

