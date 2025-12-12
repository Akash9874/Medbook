-- ============================================
-- Database Functions for Atomic Operations
-- Run this AFTER 001_schema.sql
-- ============================================

-- ============================================
-- BOOK SLOT FUNCTION (Concurrency Safe)
-- 
-- This is the CORE of our concurrency handling.
-- Uses SELECT FOR UPDATE NOWAIT to:
-- 1. Lock the row immediately
-- 2. Fail fast if another transaction has the lock
-- 3. Prevent race conditions completely
-- ============================================
CREATE OR REPLACE FUNCTION book_slot(
    p_user_id UUID,
    p_slot_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot RECORD;
    v_booking RECORD;
    v_doctor_id UUID;
BEGIN
    -- Step 1: Try to lock the slot row
    -- NOWAIT means if another transaction holds the lock, fail immediately
    -- This prevents users from waiting and provides instant feedback
    SELECT s.*, d.name as doctor_name 
    INTO v_slot
    FROM slots s
    JOIN doctors d ON s.doctor_id = d.id
    WHERE s.id = p_slot_id 
    AND s.is_available = true
    FOR UPDATE OF s NOWAIT;
    
    -- Step 2: Check if slot was found and available
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_UNAVAILABLE',
            'message', 'This slot is no longer available'
        );
    END IF;
    
    v_doctor_id := v_slot.doctor_id;
    
    -- Step 3: Create booking with PENDING status
    -- Booking expires in 2 minutes if not confirmed
    INSERT INTO bookings (
        user_id, 
        slot_id, 
        doctor_id,
        status, 
        expires_at
    )
    VALUES (
        p_user_id, 
        p_slot_id, 
        v_doctor_id,
        'PENDING', 
        NOW() + INTERVAL '2 minutes'
    )
    RETURNING * INTO v_booking;
    
    -- Step 4: Mark slot as unavailable
    UPDATE slots 
    SET is_available = false 
    WHERE id = p_slot_id;
    
    -- Step 5: Return success with booking details
    RETURN jsonb_build_object(
        'success', true,
        'booking', jsonb_build_object(
            'id', v_booking.id,
            'slot_id', v_booking.slot_id,
            'doctor_id', v_booking.doctor_id,
            'doctor_name', v_slot.doctor_name,
            'start_time', v_slot.start_time,
            'end_time', v_slot.end_time,
            'status', v_booking.status,
            'expires_at', v_booking.expires_at,
            'created_at', v_booking.created_at
        )
    );
    
EXCEPTION
    WHEN lock_not_available THEN
        -- Another user is currently booking this slot
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_LOCKED',
            'message', 'Another user is booking this slot. Please try again in a moment.'
        );
    WHEN unique_violation THEN
        -- Slot was already booked (race condition caught at DB level)
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_ALREADY_BOOKED',
            'message', 'This slot was just booked by another user.'
        );
END;
$$;


-- ============================================
-- CONFIRM BOOKING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION confirm_booking(
    p_user_id UUID,
    p_booking_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Get and lock the booking
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id
    AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BOOKING_NOT_FOUND',
            'message', 'Booking not found'
        );
    END IF;
    
    -- Check if already confirmed or failed
    IF v_booking.status != 'PENDING' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_STATUS',
            'message', 'Booking cannot be confirmed. Current status: ' || v_booking.status
        );
    END IF;
    
    -- Check if expired
    IF v_booking.expires_at < NOW() THEN
        -- Mark as failed
        UPDATE bookings SET status = 'FAILED' WHERE id = p_booking_id;
        -- Release the slot
        UPDATE slots SET is_available = true WHERE id = v_booking.slot_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BOOKING_EXPIRED',
            'message', 'Booking has expired. Please try booking again.'
        );
    END IF;
    
    -- Confirm the booking
    UPDATE bookings 
    SET 
        status = 'CONFIRMED',
        confirmed_at = NOW(),
        expires_at = NULL
    WHERE id = p_booking_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Booking confirmed successfully'
    );
END;
$$;


-- ============================================
-- CANCEL BOOKING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION cancel_booking(
    p_user_id UUID,
    p_booking_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Get and lock the booking
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id
    AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BOOKING_NOT_FOUND',
            'message', 'Booking not found'
        );
    END IF;
    
    -- Can only cancel PENDING or CONFIRMED bookings
    IF v_booking.status NOT IN ('PENDING', 'CONFIRMED') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_STATUS',
            'message', 'Booking cannot be cancelled. Current status: ' || v_booking.status
        );
    END IF;
    
    -- Cancel the booking
    UPDATE bookings 
    SET 
        status = 'CANCELLED',
        cancelled_at = NOW()
    WHERE id = p_booking_id;
    
    -- Release the slot
    UPDATE slots 
    SET is_available = true 
    WHERE id = v_booking.slot_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Booking cancelled successfully'
    );
END;
$$;


-- ============================================
-- EXPIRE PENDING BOOKINGS FUNCTION
-- Called by a scheduled job (pg_cron) or manually
-- ============================================
CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    -- Find and update expired PENDING bookings
    WITH expired AS (
        UPDATE bookings 
        SET status = 'FAILED'
        WHERE status = 'PENDING' 
        AND expires_at < NOW()
        RETURNING slot_id
    )
    -- Release the slots
    UPDATE slots 
    SET is_available = true 
    WHERE id IN (SELECT slot_id FROM expired);
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    RETURN v_expired_count;
END;
$$;

