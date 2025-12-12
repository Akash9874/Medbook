import { Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-xl group-hover:shadow-primary-500/30 transition-shadow">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-display font-semibold text-xl text-slate-900">
                Med<span className="text-primary-600">Book</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Find Doctors
              </Link>
              {isAuthenticated && (
                <Link
                  to="/my-bookings"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiCalendar className="w-4 h-4" />
                  My Appointments
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="btn-secondary text-sm"
                  >
                    <FiSettings className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  <FiUser className="w-4 h-4" />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

