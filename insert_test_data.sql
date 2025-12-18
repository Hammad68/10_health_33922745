-- Use the correct database
USE health;

-- Insert default staff user (gold / smiths) & dummy patient user
-- Password is bcrypt hash for: smiths
INSERT INTO users (username, password, role)
VALUES (
    'gold',
    '$2b$10$FO15XZSkGOJxx/XdFW7t6.JDIP7y4Fg4c9NMPPyHRnb4D8a49b6KK',
    'staff'
),
( 
    'smiths',
    '$2a$12$EiItgNzPi4FKC/N.iHehVOJ3.dE1RoOuie7ys93FwuQMA3AvkSo36',
    'patient'
);

-- Insert dummy patients
INSERT INTO patients (name, dob, email, phone) VALUES
('Alice Brown', '1991-01-1', 'alice.brown@test.com', '07111111111'),
('John Smith', '1990-05-17','john.smith@test.com', '07222222222'),
('Maria Khan', '2010-02-27','maria.khan@test.com', '07333333333');

-- Insert dummy appointments
INSERT INTO appointments (patient_id, appointment_date, appointment_time, reason, status) VALUES
(1, '2025-12-20', '10:00:00', 'General check-up', 'Confirmed'),
(2, '2025-12-21', '14:30:00', 'Follow-up consultation', 'Cancelled'),
(3, '2025-12-22', '09:15:00', 'Blood pressure review', 'Confirmed');