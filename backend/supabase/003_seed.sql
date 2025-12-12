-- ============================================
-- Seed Data for Development/Testing
-- Run this AFTER schema and functions
-- ============================================

-- ============================================
-- Create Admin User
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO users (id, email, password_hash, name, phone, role)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@medbook.com',
    '$2a$10$rQnP.VLhBXLCQBxQMgQG6.oX5K8LQK8V.3/XL3B5yJgJgXZZ5K7Ey',
    'Admin User',
    '+1234567890',
    'ADMIN'
);

-- ============================================
-- Create Sample Doctors
-- ============================================
INSERT INTO doctors (id, name, email, specialization, qualification, experience_years, consultation_fee, bio, is_active)
VALUES 
(
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Sarah Johnson',
    'sarah.johnson@medbook.com',
    'Cardiology',
    'MD, FACC',
    15,
    150.00,
    'Dr. Johnson is a board-certified cardiologist with extensive experience in preventive cardiology and heart disease management.',
    true
),
(
    'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Dr. Michael Chen',
    'michael.chen@medbook.com',
    'Dermatology',
    'MD, FAAD',
    12,
    120.00,
    'Dr. Chen specializes in medical and cosmetic dermatology, treating a wide range of skin conditions.',
    true
),
(
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Dr. Emily Williams',
    'emily.williams@medbook.com',
    'Pediatrics',
    'MD, FAAP',
    10,
    100.00,
    'Dr. Williams is passionate about child health and development, providing comprehensive care for children from infancy through adolescence.',
    true
),
(
    'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Dr. James Martinez',
    'james.martinez@medbook.com',
    'Orthopedics',
    'MD, FAAOS',
    18,
    175.00,
    'Dr. Martinez is an orthopedic surgeon specializing in sports medicine and joint replacement surgery.',
    true
),
(
    'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Dr. Lisa Patel',
    'lisa.patel@medbook.com',
    'General Medicine',
    'MD',
    8,
    80.00,
    'Dr. Patel provides comprehensive primary care services, focusing on preventive medicine and chronic disease management.',
    true
);

-- ============================================
-- Create Sample Slots (Next 7 days)
-- ============================================
-- Function to generate slots for a doctor
DO $$
DECLARE
    doc_id UUID;
    slot_date DATE;
    slot_time TIME;
    slot_times TIME[] := ARRAY['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']::TIME[];
    t TIME;
BEGIN
    -- For each doctor
    FOR doc_id IN SELECT id FROM doctors LOOP
        -- For each of the next 7 days
        FOR i IN 0..6 LOOP
            slot_date := CURRENT_DATE + i;
            -- Skip weekends
            IF EXTRACT(DOW FROM slot_date) NOT IN (0, 6) THEN
                -- For each time slot
                FOREACH t IN ARRAY slot_times LOOP
                    INSERT INTO slots (doctor_id, start_time, end_time, is_available)
                    VALUES (
                        doc_id,
                        slot_date + t,
                        slot_date + t + INTERVAL '30 minutes',
                        true
                    )
                    ON CONFLICT (doctor_id, start_time) DO NOTHING;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

