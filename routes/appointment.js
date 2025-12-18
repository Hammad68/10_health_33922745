// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const { query, check, validationResult } = require('express-validator');
// const { render } = require("pug");

const requireAdmin = (req, res, next) => {
  if (!req.session.userId) {
    req.session.msg = 'You must log in first';
    return res.redirect('/appointment/login');
  }

  if (req.session.role !== 'staff') {
    return res.status(403).send('Access denied: Admins only');
  }

  next();
};

router.get('/register', requireAdmin, function (req, res, next) {
    res.render('register.ejs', {
    errors: [],
    formData: {}
    });
})

router.get('/appointments', requireAdmin, function (req, res, next) {
    res.render('appointment.ejs');
});

// Display login audit history
router.get('/getting-patients-data', requireAdmin, function (req, res, next) {
    let sqlquery = "SELECT id, name, dob FROM patients ORDER BY name"; 
    
    db.query(sqlquery, (err, result) => {
        if (err) return next(err);
        res.render('appointment.ejs', { patients: result, errors: []});
    });
});

// Display login audit history
router.post('/booking-appointment', 
    [
        check('patient_id').isInt().withMessage('Invalid patient'),
        check('appointment_date').isISO8601().withMessage('Invalid date'),
        check('appointment_time').matches(/^\d{2}:\d{2}$/).withMessage('Invalid time'),
        check('reason').isLength({ min: 3, max: 255 }).withMessage('Reason is required').trim().escape()
    
    ], requireAdmin, function (req, res, next) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            db.query('SELECT id, name, dob FROM patients ORDER BY name', (err, patients) => {
               if (err) return next(err);
               return res.render('appointment.ejs', {
                    errors: errors.array(),
                    patients
               });
            });
        }
        else {

            const {patient_id, appointment_date, appointment_time, reason} = req.body;

            let sqlquery = "INSERT INTO appointments (patient_id, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?)";
            
            db.query(sqlquery, [patient_id, appointment_date, appointment_time, reason], (err, result) => {
                if (err) return next(err);
                res.redirect('/');
            });
        }
});

// Display login audit history
router.get('/patients-appointments', requireAdmin, function (req, res, next) {
    let sqlquery = "SELECT id, name, dob FROM patients ORDER BY name"; 
    
    db.query(sqlquery, (err, result) => {
        if (err) return next(err);
        res.render('appointment.ejs', { patients: result });
    });
});

router.get('/admin-appointments', requireAdmin, (req, res, next) => {

  const sql = `
    SELECT 
      a.id,
      a.appointment_date,
      a.appointment_time,
      a.reason,
      a.status,
      p.name AS patient_name,
      p.dob AS date_of_birth,
      p.email,
      p.phone
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    ORDER BY a.appointment_date, a.appointment_time
  `;

  db.query(sql, (err, appointments) => {
    if (err) return next(err);

    res.render('admin-appointments.ejs', {
      appointments
    });
  });
});



// Export router to be used in index.js
module.exports = router