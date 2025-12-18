// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const { query, check, validationResult } = require('express-validator');

// Main dashboard for patients to view their upcoming appointments
router.get('/dashboard', (req, res, next) => {
    const username = req.session.userId;

    const sql = `SELECT a.appointment_date AS Date,
                        a.appointment_time AS Time,
                        a.reason AS Appointment_Reason,
                        a.status AS Appointment_Status,
                        p.name AS Patient_Name,
                        r.username AS Patient_Username
                 FROM appointments  a JOIN patients p ON a.patient_id = p.id
                 JOIN registered r on r.patient_id = p.id
                 WHERE r.username = ?
                 ORDER BY a.appointment_date, a.appointment_time`;
    db.query(sql, [username], (err, appointments) => {
        if (err) return next(err);
        // console.log(appointments);
        res.render('patient-homepage.ejs', { appointments });
    });  
});


// Export router to be used in index.js
module.exports = router