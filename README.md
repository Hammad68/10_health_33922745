# Health Management System

## Overview
This project is a web-based Health Management System built using Node.js, Express, MySQL, and EJS. It allows administrative staff to manage patients, book appointments, and monitor system access through audit logs. The system enforces role-based access control and secure authentication.

## Features
- User Authentication
  - Secure login using bcrypt-hashed passwords
  - Session-based authentication
  - Role-based access control (staff and patient)
  - Login audit logging with IP address and timestamp

- Patient Management
  - Register, edit, delete, and search patients
  - Stores patient name, date of birth, email, and phone number
  - Patient data displayed in tabular format
  - Export patient records to CSV

- Appointment Management
  - Book appointments using patient ID while displaying patient name and date of birth
  - Store appointment date, time, reason, and status
  - Input validation on all appointment fields

- Security and Validation
  - Server-side validation using express-validator
  - Password hashing with bcrypt
  - Parameterized SQL queries to prevent SQL injection
  - Middleware-protected admin routes

## Technology Stack
- Backend: Node.js, Express.js
- Database: MySQL
- Frontend: EJS, HTML, CSS
- Authentication: bcrypt, express-session
- Validation: express-validator

## Installation and Setup
1. Clone the repository
2. Install dependencies:
   npm install
3. Configure the MySQL database and import the provided SQL schema
4. Start the application:
   npm start

## Usage
- Staff users can manage patients and appointments
- Patients can view their appointment history
- Admin-only pages are protected using middleware

## Future Enhancements
- Email notifications for appointment confirmations
- Improved UI and accessibility
- Pagination and filtering for large datasets
- Password reset functionality