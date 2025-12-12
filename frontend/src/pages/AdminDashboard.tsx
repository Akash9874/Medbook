import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { FiPlus, FiUsers, FiCalendar, FiClock, FiTrash2, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { doctorApi, slotApi, bookingApi } from '../services/api';
import { Modal } from '../components/common/Modal';
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { Doctor, Booking, DoctorForm } from '../types';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'slots' | 'bookings'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'doctors') {
        const response = await doctorApi.getAll({ limit: 100 });
        setDoctors(response.data);
      } else if (activeTab === 'bookings') {
        const response = await bookingApi.getAll({});
        setBookings(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await doctorApi.delete(id);
      toast.success('Doctor deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete doctor');
    }
  };

  const handleExpirePending = async () => {
    try {
      const response = await bookingApi.expirePending();
      toast.success(response.message || 'Pending bookings expired');
      fetchData();
    } catch (error) {
      toast.error('Failed to expire pending bookings');
    }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-500">Manage doctors, slots, and bookings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { id: 'doctors', label: 'Doctors', icon: FiUsers },
          { id: 'slots', label: 'Slots', icon: FiClock },
          { id: 'bookings', label: 'Bookings', icon: FiCalendar },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {activeTab === 'doctors' && (
            <DoctorsTab
              doctors={doctors}
              onAdd={() => {
                setEditingDoctor(null);
                setShowDoctorModal(true);
              }}
              onEdit={(doctor) => {
                setEditingDoctor(doctor);
                setShowDoctorModal(true);
              }}
              onDelete={handleDeleteDoctor}
            />
          )}

          {activeTab === 'slots' && (
            <SlotsTab
              doctors={doctors}
              onAddSlot={() => setShowSlotModal(true)}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab
              bookings={bookings}
              onExpirePending={handleExpirePending}
            />
          )}
        </>
      )}

      {/* Doctor Modal */}
      <Modal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        size="lg"
      >
        <DoctorForm
          doctor={editingDoctor}
          onSuccess={() => {
            setShowDoctorModal(false);
            fetchData();
          }}
          onCancel={() => setShowDoctorModal(false)}
        />
      </Modal>

      {/* Slot Modal */}
      <Modal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        title="Create Slots"
        size="lg"
      >
        <SlotForm
          doctors={doctors}
          onSuccess={() => {
            setShowSlotModal(false);
            toast.success('Slots created successfully');
          }}
          onCancel={() => setShowSlotModal(false)}
        />
      </Modal>
    </div>
  );
}

// Sub-components
function DoctorsTab({
  doctors,
  onAdd,
  onEdit,
  onDelete,
}: {
  doctors: Doctor[];
  onAdd: () => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {doctors.length} Doctor{doctors.length !== 1 ? 's' : ''}
        </h2>
        <button onClick={onAdd} className="btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Doctor
        </button>
      </div>

      {doctors.length === 0 ? (
        <EmptyState
          icon={<FiUsers className="w-8 h-8" />}
          title="No doctors yet"
          description="Add your first doctor to get started"
          action={
            <button onClick={onAdd} className="btn-primary">
              Add Doctor
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                  <p className="text-sm text-primary-600">{doctor.specialization}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(doctor)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(doctor.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                <p>Experience: {doctor.experience_years} years</p>
                <p>Fee: ${doctor.consultation_fee}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotsTab({
  onAddSlot,
}: {
  doctors: Doctor[];
  onAddSlot: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Manage Slots</h2>
        <button onClick={onAddSlot} className="btn-primary">
          <FiPlus className="w-4 h-4" />
          Create Slots
        </button>
      </div>

      <div className="card p-6">
        <p className="text-slate-500">
          Select a doctor and date to create appointment slots.
          You can create multiple time slots at once.
        </p>
      </div>
    </div>
  );
}

function BookingsTab({
  bookings,
  onExpirePending,
}: {
  bookings: Booking[];
  onExpirePending: () => void;
}) {
  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning',
    CONFIRMED: 'badge-success',
    FAILED: 'badge-danger',
    CANCELLED: 'badge-danger',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {bookings.length} Booking{bookings.length !== 1 ? 's' : ''}
        </h2>
        <button onClick={onExpirePending} className="btn-secondary">
          Expire Pending Bookings
        </button>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<FiCalendar className="w-8 h-8" />}
          title="No bookings yet"
          description="Bookings will appear here when users make appointments"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Patient</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Doctor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{booking.user_name}</p>
                    <p className="text-sm text-slate-500">{booking.user_email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{booking.doctor_name}</p>
                    <p className="text-sm text-slate-500">{booking.specialization}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-900">
                      {format(parseISO(booking.start_time), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(parseISO(booking.start_time), 'h:mm a')}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={statusColors[booking.status]}>{booking.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Forms
function DoctorForm({
  doctor,
  onSuccess,
  onCancel,
}: {
  doctor: Doctor | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<DoctorForm>({
    name: doctor?.name || '',
    email: doctor?.email || '',
    specialization: doctor?.specialization || '',
    qualification: doctor?.qualification || '',
    experience_years: doctor?.experience_years || 0,
    consultation_fee: doctor?.consultation_fee || 0,
    bio: doctor?.bio || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (doctor) {
        await doctorApi.update(doctor.id, formData);
        toast.success('Doctor updated');
      } else {
        await doctorApi.create(formData);
        toast.success('Doctor created');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save doctor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Specialization</label>
          <input
            type="text"
            value={formData.specialization}
            onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Qualification</label>
          <input
            type="text"
            value={formData.qualification}
            onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Experience (years)</label>
          <input
            type="number"
            value={formData.experience_years}
            onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
            className="input"
            min="0"
          />
        </div>
        <div>
          <label className="label">Consultation Fee ($)</label>
          <input
            type="number"
            value={formData.consultation_fee}
            onChange={(e) => setFormData(prev => ({ ...prev, consultation_fee: parseFloat(e.target.value) || 0 }))}
            className="input"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="label">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          className="input min-h-[100px]"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? <LoadingSpinner size="sm" /> : null}
          {doctor ? 'Update' : 'Create'} Doctor
        </button>
      </div>
    </form>
  );
}

function SlotForm({
  doctors,
  onSuccess,
  onCancel,
}: {
  doctors: Doctor[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const generateSlots = () => {
    const slots: { start_time: string; end_time: string }[] = [];
    let current = parseInt(startTime.replace(':', ''));
    const end = parseInt(endTime.replace(':', ''));

    while (current < end) {
      const startHour = Math.floor(current / 100);
      const startMin = current % 100;
      const endMin = startMin + duration;
      let endHour = startHour;

      if (endMin >= 60) {
        endHour += 1;
      }

      const slotEnd = endMin >= 60 ? endMin - 60 : endMin;
      
      slots.push({
        start_time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
        end_time: `${String(endHour).padStart(2, '0')}:${String(slotEnd).padStart(2, '0')}`,
      });

      current = endHour * 100 + slotEnd;
    }

    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    setIsLoading(true);
    const slots = generateSlots();

    try {
      await slotApi.createBulk({ doctor_id: doctorId, date, slots });
      onSuccess();
    } catch (error) {
      toast.error('Failed to create slots');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Doctor</label>
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className="input"
          required
        >
          <option value="">Select a doctor</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} - {doc.specialization}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
          min={format(new Date(), 'yyyy-MM-dd')}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Duration (mins)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="input"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          This will create <strong>{generateSlots().length}</strong> slots of {duration} minutes each.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? <LoadingSpinner size="sm" /> : null}
          Create Slots
        </button>
      </div>
    </form>
  );
}

