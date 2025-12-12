import { useState } from 'react';
import { FiSearch, FiFilter, FiUsers } from 'react-icons/fi';
import { useDoctors, useSpecializations } from '../hooks/useDoctors';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  
  const { doctors, isLoading, error } = useDoctors({ specialization: selectedSpec || undefined });
  const { specializations } = useSpecializations();

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Book Doctor Appointments
              <span className="block text-primary-200">With Ease</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Find and book appointments with top doctors in your area. 
              Quick, secure, and hassle-free scheduling.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctors by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 shadow-xl shadow-primary-900/20 focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Filters & Doctors List */}
      <section className="page-container -mt-4 relative z-10">
        {/* Specialization Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filter by Specialization</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSpec('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedSpec === ''
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
              }`}
            >
              All Doctors
            </button>
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(spec)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSpec === spec
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            icon={<FiUsers className="w-8 h-8" />}
            title="Unable to load doctors"
            description={error}
          />
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon={<FiUsers className="w-8 h-8" />}
            title="No doctors found"
            description="Try adjusting your search or filter criteria"
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} Available
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className="animate-in opacity-0"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <DoctorCard doctor={doctor} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

