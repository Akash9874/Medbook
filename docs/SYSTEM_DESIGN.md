# System Design Document: MedBook

## 1. Overview

MedBook is a doctor appointment booking system designed to handle high concurrency scenarios while preventing race conditions and double-booking. This document outlines the technical architecture and design decisions.

## 2. Problem Statement

Design a scalable appointment booking system that:
- Allows users to book doctor appointments
- Prevents overbooking even under high concurrent load
- Provides real-time availability updates
- Handles booking expiry automatically

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENTS                                      │
│                    (Web Browsers, Mobile Apps)                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER                                    │
│                         (AWS ALB / Cloudflare)                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│         API SERVER 1          │       │         API SERVER 2          │
│      (Node.js + Express)      │       │      (Node.js + Express)      │
└───────────────────────────────┘       └───────────────────────────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CONNECTION POOL                                    │
│                           (pg Pool - max 20)                                  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│       PRIMARY DATABASE        │◄──────│        READ REPLICA           │
│        (PostgreSQL)           │       │       (PostgreSQL)            │
└───────────────────────────────┘       └───────────────────────────────┘
```

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    USERS    │       │   DOCTORS   │       │    SLOTS    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ name        │       │ doctor_id   │──┐
│ password    │       │ specializ.  │       │ start_time  │  │
│ name        │       │ experience  │       │ end_time    │  │
│ role        │       │ fee         │       │ is_available│  │
└─────────────┘       └─────────────┘       └─────────────┘  │
      │                     ▲                     ▲           │
      │                     │                     │           │
      │               ┌─────┴─────────────────────┴───────────┘
      │               │
      │       ┌───────┴─────┐
      │       │  BOOKINGS   │
      │       ├─────────────┤
      └──────►│ user_id     │
              │ slot_id     │
              │ doctor_id   │
              │ status      │
              │ expires_at  │
              └─────────────┘
```

### 4.2 Indexing Strategy

```sql
-- High-traffic queries
CREATE INDEX idx_slots_available ON slots(doctor_id, is_available, start_time) 
    WHERE is_available = true;

-- Booking expiry checks
CREATE INDEX idx_bookings_expiry ON bookings(expires_at) 
    WHERE status = 'PENDING';

-- User booking history
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at DESC);
```

## 5. Concurrency Control Strategy

### 5.1 The Race Condition Problem

```
Timeline:
─────────────────────────────────────────────────────────────────────────►
    T1                  T2                  T3
    │                   │                   │
User A reads slot ──────│───────────────────│
(available)             │                   │
    │              User B reads slot ───────│
    │              (available)              │
    │                   │                   │
    ├── User A books ───┤                   │
    │                   │                   │
    │                   ├── User B books ───┤  ❌ DOUBLE BOOKING!
    │                   │                   │
```

### 5.2 Our Solution: Pessimistic Locking

```sql
CREATE FUNCTION book_slot(p_user_id UUID, p_slot_id UUID)
RETURNS JSONB AS $$
BEGIN
    -- Lock the row immediately, fail if already locked
    SELECT * FROM slots 
    WHERE id = p_slot_id AND is_available = true
    FOR UPDATE NOWAIT;  -- ← Key: NOWAIT means fail immediately
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
    END IF;
    
    -- Create booking
    INSERT INTO bookings (...) VALUES (...);
    
    -- Mark unavailable
    UPDATE slots SET is_available = false WHERE id = p_slot_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN lock_not_available THEN
        RETURN jsonb_build_object('success', false, 'error', 'SLOT_LOCKED');
END;
$$;
```

### 5.3 Why This Approach?

| Approach | Pros | Cons | Our Choice |
|----------|------|------|------------|
| Optimistic Locking | Good for low contention | Retries needed, user frustration | ❌ |
| Pessimistic Locking | Immediate feedback, no retries | May block under high load | ✅ (with NOWAIT) |
| Distributed Locks (Redis) | Works across services | Additional infrastructure | ❌ (overkill for now) |
| Queue-based | Guaranteed order | Complex, latency | ❌ |

**Decision:** Pessimistic locking with `FOR UPDATE NOWAIT` because:
1. Immediate feedback to users (no waiting)
2. No infrastructure complexity
3. PostgreSQL handles all atomicity
4. Scales well for appointment systems (low contention)

## 6. Scaling Strategies

### 6.1 Horizontal Scaling (Multiple API Servers)

```
                    Load Balancer
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Server 1       Server 2       Server 3
          │              │              │
          └──────────────┼──────────────┘
                         │
                   Connection Pool
                         │
                    PostgreSQL
```

- Stateless API servers behind load balancer
- Shared PostgreSQL database handles consistency
- Connection pooling prevents database overload

### 6.2 Database Scaling

**Phase 1: Read Replicas**
```
Primary (Write) ─────► Replica 1 (Read)
                 └───► Replica 2 (Read)
```
- Route read queries to replicas
- Booking writes always go to primary

**Phase 2: Sharding (If needed)**
```
Shard by doctor_id:
- Shard A: Doctors A-M
- Shard B: Doctors N-Z
```

### 6.3 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                         CACHE LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│  Level 1: In-Memory (Node.js)                                   │
│  - Specializations list (TTL: 1 hour)                          │
│  - Doctor basic info (TTL: 5 mins)                             │
├─────────────────────────────────────────────────────────────────┤
│  Level 2: Redis (Production)                                    │
│  - Doctor details (TTL: 10 mins)                               │
│  - Available slots (TTL: 30 secs)                              │
│  - User sessions                                                │
├─────────────────────────────────────────────────────────────────┤
│  NEVER CACHE:                                                   │
│  - Booking operations (must be real-time)                      │
│  - Slot availability during booking (use DB lock)              │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Booking Expiry System

### 7.1 Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Book Slot] ──► PENDING ──┬──► [Confirm] ──► CONFIRMED        │
│                            │                                    │
│                            └──► [2 min timeout] ──► FAILED     │
│                            │                                    │
│                            └──► [Cancel] ──► CANCELLED         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Implementation

**PostgreSQL Scheduled Job (pg_cron):**
```sql
SELECT cron.schedule('expire-bookings', '* * * * *', $$
    WITH expired AS (
        UPDATE bookings SET status = 'FAILED'
        WHERE status = 'PENDING' AND expires_at < NOW()
        RETURNING slot_id
    )
    UPDATE slots SET is_available = true
    WHERE id IN (SELECT slot_id FROM expired);
$$);
```

## 8. API Rate Limiting

```
┌─────────────────────────────────────────────────────────────────┐
│                      RATE LIMITS                                │
├─────────────────────────────────────────────────────────────────┤
│  General API:     100 requests / 15 minutes / IP                │
│  Auth endpoints:  10 requests / 15 minutes / IP                 │
│  Booking:         5 requests / 1 minute / user                  │
└─────────────────────────────────────────────────────────────────┘
```

## 9. Security Measures

1. **Authentication:** JWT tokens with expiry
2. **Authorization:** Role-based access (USER, ADMIN)
3. **Input Validation:** Express-validator on all inputs
4. **SQL Injection:** Parameterized queries only
5. **Rate Limiting:** Express-rate-limit
6. **CORS:** Restricted to frontend origin
7. **Helmet:** Security headers

## 10. Monitoring & Observability (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                             │
├─────────────────────────────────────────────────────────────────┤
│  Metrics:     Prometheus + Grafana                              │
│  Logging:     Winston + ELK Stack                               │
│  Tracing:     Jaeger (for distributed tracing)                  │
│  Alerting:    PagerDuty / Slack                                 │
├─────────────────────────────────────────────────────────────────┤
│  Key Metrics:                                                   │
│  - Booking success/failure rate                                 │
│  - Lock contention rate                                         │
│  - API response times (p50, p95, p99)                          │
│  - Database connection pool utilization                         │
└─────────────────────────────────────────────────────────────────┘
```

## 11. Future Improvements

1. **WebSocket Integration** - Real-time slot updates instead of polling
2. **Message Queue** - Async processing for notifications
3. **Microservices** - Separate booking, notification, and user services
4. **GraphQL** - More flexible API for complex queries
5. **Mobile App** - React Native client

## 12. Conclusion

This system is designed to:
- ✅ Handle concurrent booking requests safely
- ✅ Scale horizontally with minimal changes
- ✅ Provide immediate feedback to users
- ✅ Auto-expire stale bookings
- ✅ Maintain data consistency at all times

The use of PostgreSQL's transactional guarantees and row-level locking provides a simple yet robust solution for the concurrency challenges inherent in booking systems.

