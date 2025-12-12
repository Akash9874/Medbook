import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addDays } from 'date-fns';
import { FiArrowLeft, FiCalendar, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDoctor } from '../hooks/useDoctors';
import { useSlots } from '../hooks/useSlots';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { SlotPicker } from '../components/booking/SlotPicker';
import { BookingConfirmation } from '../components/booking/BookingConfirmation';
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import type { Slot, Booking } from '../types';

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const { doctor, isLoading: doctorLoading, error: doctorError } = useDoctor(id);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { slots, isLoading: slotsLoading } = useSlots({ 
    doctorId: id || '', 
    date: selectedDate,
    pollingInterval: 10000 // Poll every 10 seconds for real-time updates
  });
  
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const { createBooking, confirmBooking, selectSlot: setContextSlot } = useBooking();

  // Generate next 7 days for date picker
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE, MMM d'),
    };
  });

  const handleSlotSelect = (slot: Slot) => {
    if (!isAuthenticated) {
      toast.error('Please login to book an appointment');
      navigate('/login', { state: { from: `/booking/${id}` } });
      return;
    }
    setSelectedSlot(slot);
    setContextSlot(slot); // Also update context so createBooking works
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !doctor) return;

    setIsBooking(true);
    try {
      const booking = await createBooking();
      setCurrentBooking(booking);
      setShowConfirmModal(true);
      toast.success('Slot reserved! Please confirm within 2 minutes.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!currentBooking) return;

    setIsBooking(true);
    try {
      await confirmBooking(currentBooking.id);
      toast.success('Appointment confirmed successfully!');
      // Update local state
      setCurrentBooking(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setCurrentBooking(null);
    setSelectedSlot(null);
    setContextSlot(null);
    // Refresh slots
    window.location.reload();
  };

  if (doctorLoading) {
    return <PageLoader />;
  }

  if (doctorError || !doctor) {
    return (
      <div className="page-container text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Doctor not found</h2>
        <p className="text-slate-500 mb-4">The doctor you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  const initials = doctor.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Doctors
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Doctor Info */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white font-semibold text-2xl shadow-lg shadow-primary-500/20">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{doctor.name}</h1>
                <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                {doctor.qualification && (
                  <p className="text-sm text-slate-500">{doctor.qualification}</p>
                )}
              </div>
            </div>

            {doctor.bio && (
              <p className="text-slate-600 text-sm mb-6">{doctor.bio}</p>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Experience</span>
                <span className="font-medium text-slate-900">{doctor.experience_years} years</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Consultation Fee</span>
                <span className="font-medium text-slate-900">${doctor.consultation_fee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Selection */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-primary-500" />
              Select Appointment Slot
            </h2>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="label">Select Date</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedDate(option.value);
                      setSelectedSlot(null);
                      setContextSlot(null);
                    }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedDate === option.value
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Slots */}
            <div className="mb-6">
              <label className="label flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Available Time Slots
              </label>
              <SlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={handleSlotSelect}
                isLoading={slotsLoading}
              />
            </div>

            {/* Book Button */}
            {selectedSlot && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-primary-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-primary-700">
                    <strong>Selected:</strong>{' '}
                    {format(parseISO(selectedSlot.start_time), 'EEEE, MMMM d')} at{' '}
                    {format(parseISO(selectedSlot.start_time), 'h:mm a')}
                  </p>
                </div>
                <button
                  onClick={handleBookSlot}
                  disabled={isBooking}
                  className="btn-primary w-full"
                >
                  {isBooking ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Reserving Slot...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        title="Confirm Your Booking"
        size="md"
      >
        {currentBooking && selectedSlot && (
          <BookingConfirmation
            booking={currentBooking}
            doctor={doctor}
            slot={selectedSlot}
            onConfirm={handleConfirmBooking}
            onCancel={handleCloseModal}
            isLoading={isBooking}
          />
        )}
      </Modal>
    </div>
  );
}

