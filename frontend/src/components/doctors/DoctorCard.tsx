import { Link } from 'react-router-dom';
import { FiClock, FiDollarSign, FiAward, FiCalendar } from 'react-icons/fi';
import type { Doctor } from '../../types';

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const initials = doctor.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link to={`/booking/${doctor.id}`} className="card-hover p-6 block group">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-primary-500/20 group-hover:shadow-xl group-hover:shadow-primary-500/30 transition-shadow">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
            {doctor.name}
          </h3>
          <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
          {doctor.qualification && (
            <p className="text-xs text-slate-500 mt-0.5">{doctor.qualification}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FiAward className="w-4 h-4 text-amber-500" />
          <span>{doctor.experience_years} years exp.</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FiDollarSign className="w-4 h-4 text-emerald-500" />
          <span>${doctor.consultation_fee}</span>
        </div>
      </div>

      {doctor.available_slots !== undefined && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FiCalendar className="w-4 h-4 text-primary-500" />
            <span className="text-slate-600">
              <span className="font-medium text-primary-600">{doctor.available_slots}</span> slots available
            </span>
          </div>
          <span className="text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
            Book Now →
          </span>
        </div>
      )}
    </Link>
  );
}

