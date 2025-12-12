# 🏥 MedBook - Doctor Appointment Booking System

A full-stack doctor appointment booking system with **concurrency-safe booking** using PostgreSQL transactions and row-level locking.

![MedBook](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)

## 🌟 Features

### Core Features
- **User Registration & Authentication** - JWT-based auth system
- **Doctor Management** - Admin can add/edit/remove doctors
- **Slot Management** - Create time slots for doctors
- **Concurrency-Safe Booking** - Prevents double-booking using PostgreSQL row-level locks
- **Real-time Slot Updates** - Polling mechanism for live availability
- **Booking Expiry** - Auto-expires pending bookings after 2 minutes

### Technical Highlights
- **Race Condition Prevention** - Uses `SELECT FOR UPDATE NOWAIT` for atomic booking
- **Database Functions** - Complex booking logic encapsulated in PostgreSQL functions
- **Rate Limiting** - Prevents abuse with tiered rate limits
- **API Documentation** - Swagger UI for API exploration
- **TypeScript** - Full type safety in frontend

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)                │
│         Vite • TailwindCSS • React Router • Context API         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                │
│     JWT Auth • Rate Limiting • Validation • Error Handling      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE (PostgreSQL)                     │
│   Database Functions • Row-Level Locking • Auto-Expiry Cron     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/medbook.git
cd medbook

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files in order:
   - `backend/supabase/001_schema.sql`
   - `backend/supabase/002_functions.sql`
   - `backend/supabase/003_seed.sql`

3. Get your credentials from **Settings > API**:
   - Project URL
   - `anon` public key
   - `service_role` secret key

4. Get database connection string from **Settings > Database**

### 3. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=/api
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- API Docs: http://localhost:3001/api/docs

### 5. Test the App

**Admin Login:**
- Email: `admin@medbook.com`
- Password: `admin123`

## 📚 API Documentation

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/profile` | GET | Get user profile |

### Doctors
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/doctors` | GET | List all doctors | - |
| `/api/doctors/:id` | GET | Get doctor details | - |
| `/api/doctors` | POST | Create doctor | Admin |
| `/api/doctors/:id` | PUT | Update doctor | Admin |
| `/api/doctors/:id` | DELETE | Delete doctor | Admin |

### Slots
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/slots` | GET | Get available slots | - |
| `/api/slots/doctor/:id` | GET | Get doctor's slots | - |
| `/api/slots` | POST | Create slot | Admin |
| `/api/slots/bulk` | POST | Create multiple slots | Admin |

### Bookings
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/bookings` | POST | Create booking | User |
| `/api/bookings/:id/confirm` | PATCH | Confirm booking | User |
| `/api/bookings/:id/cancel` | PATCH | Cancel booking | User |
| `/api/bookings/my` | GET | Get user's bookings | User |
| `/api/bookings` | GET | Get all bookings | Admin |

## 🔐 Concurrency Handling

The system prevents race conditions using PostgreSQL's `SELECT FOR UPDATE NOWAIT`:

```sql
-- Inside book_slot function
SELECT * FROM slots 
WHERE id = slot_id AND is_available = true
FOR UPDATE NOWAIT;  -- Fails immediately if locked
```

**How it works:**
1. User A attempts to book slot X
2. Transaction locks the slot row
3. User B attempts to book slot X simultaneously
4. User B's transaction fails immediately (NOWAIT)
5. User B gets a "slot being booked by another user" message
6. User A's transaction completes successfully

## 📁 Project Structure

```
medbook/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── supabase/           # SQL migrations
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   ├── styles/         # CSS files
│   │   └── types/          # TypeScript types
│   └── package.json
│
└── docs/
    └── SYSTEM_DESIGN.md    # Technical design document
```

## 🚢 Deployment

### Backend (Railway/Render)

1. Create new project
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel)

1. Import repository
2. Set `VITE_API_URL` to your backend URL
3. Deploy

## 📝 License

MIT License

## 👤 Author

Your Name - [Your GitHub](https://github.com/yourusername)

