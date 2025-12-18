// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const { query, check, validationResult } = require('express-validator');

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

// List all registered users (no passwords shown)
router.get('/list', requireAdmin, function (req, res, next) {
    let sqlquery = "SELECT id, name, dob, email, phone FROM patients";
    
    db.query(sqlquery, (err, result) => {
        if (err) return next(err);
        res.render('paitents.ejs', {registeredUsers: result})
    });
})

// For getting the patients page with all their details
router.get('/patients', requireAdmin, (req, res, next) => {
  db.query("SELECT id, name, dob, email, phone FROM patients", (err, allPatients) => {
    if (err) return next(err);
    res.render('paitents.ejs', {
      registeredUsers: allPatients,
      searchResults: [],  // empty initially
      errors: []
    });
  });
});

// Patients page search and filter logic
router.get(
  '/search-result',
  [
    query('search-box')
        .optional({ checkFalsy: true })
        .isLength({ min: 1, max: 30 })
        .isAlpha()
        .withMessage('Name must be string, 1–30 characters')
        .trim()
        .escape(),
    query('dob')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('Date of birth must be a valid date')
  ],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('patients.ejs', {
        registeredUsers: [],
        searchResults: [],
        errors: errors.array()
      });
    }

    const searchTerm = req.query['search-box'] || '';
    const searchDate = req.query['dob'] || '';

    // Fetch full patient list
    db.query("SELECT id, name, dob, email, phone FROM patients", (err, allPatients) => {
      if (err) return next(err);

      // Build search query dynamically
      let sqlQuery = 'SELECT id, name, email, phone FROM patients WHERE 1=1';
      const params = [];

      if (searchTerm) {
        sqlQuery += " AND name LIKE ?";
        params.push(`%${searchTerm}%`);
      }
      if (searchDate) {
        sqlQuery += " AND dob = ?";
        params.push(searchDate);
      }

      db.query(sqlQuery, params, (err, searchResults) => {
        if (err) return next(err);

        // Render the same page with both lists
        res.render('paitents.ejs', {
          registeredUsers: allPatients,
          searchResults,
          errors: []
        });
      });
    });
  }
);

// For patient registering page
router.get('/register-patients', requireAdmin, function (req, res, next) {
    // res.render('register-patients.ejs');
    res.render('register-patients.ejs', { 
    errors: [],       // empty array for initial render
    formData: {}      // empty object to avoid ReferenceError
  });
})


// POST register patient
router.post(
  "/admin/register-patient",
  requireAdmin,
  [
    check("name").notEmpty().withMessage("Name is required").trim().escape(),
    check('date_of_birth').isDate().withMessage('Please enter a valid date of birth'),
    check("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    check("phone").notEmpty().withMessage("Phone is required").trim().escape(),
    check("username")
      .isLength({ min: 5, max: 20 })
      .withMessage("Username must be 5–20 characters")
      .isAlphanumeric()
      .withMessage("Username can only contain letters and numbers")
      .trim()
      .escape(),
    check("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .trim()
      .escape(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("register-patients.ejs", {
        errors: errors.array(),
        formData: req.body,
      });
    }

    const { name, date_of_birth, email, phone, username, password } = req.body;

    try {
      // Check if email already exists in patients table
      const [existingEmail] = await db
        .promise()
        .query("SELECT id FROM patients WHERE email = ?", [email]);

      if (existingEmail.length > 0) {
        return res.render("register-patients.ejs", {
          errors: [{ msg: "Email already exists" }],
          formData: req.body,
        });
      }

      // Check if username already exists in users table
      const [existingUser] = await db
        .promise()
        .query("SELECT username FROM users WHERE username = ?", [username]);

      if (existingUser.length > 0) {
        return res.render("register-patients.ejs", {
          errors: [{ msg: "Username already exists" }],
          formData: req.body,
        });
      }

      // Insert into patients table
      const [patientResult] = await db
        .promise()
        .query("INSERT INTO patients (name, dob, email, phone) VALUES (?, ?, ?, ?)", [
          name,
          date_of_birth,
          email,
          phone,
        ]);

      const patientId = patientResult.insertId;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into users table
      await db
        .promise()
        .query("INSERT INTO users (username, password, role) VALUES (?, ?, 'patient')", [
          username,
          hashedPassword,
        ]);

      // Insert into registered table
      await db
        .promise()
        .query(
          "INSERT INTO registered (patient_id, username, name, role) VALUES (?, ?, ?, 'patient')",
          [patientId, username, name]
        );

      // Success redirect
      res.redirect("/admin-patients/patients");
    } catch (err) {
      next(err);
    }
  }
);

// For updating and deleting patients records

router.get('/patients/edit/:id', requireAdmin, (req, res, next) => {

  const id = req.params.id
  const sql = "SELECT id, name, email, phone FROM patients WHERE id = ?";

  db.query(sql, [id], (err, rows) => {
    if (err) return next(err);

    res.render('edit-patient.ejs', { patient: rows[0] });
  });
});

router.post(
  '/update/patients/edit/:id',
  [
    check('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Name is required and must be less than 50 characters'),
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    check('phone')
      .trim()
      .matches(/^\d{10,15}$/)
      .withMessage('Phone must be 10 to 15 digits')
  ],
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Fetch patient data again to populate form
      const id = req.params.id;
      db.query("SELECT id, name, email, phone FROM patients WHERE id = ?", [id], (err, rows) => {
        if (err) return next(err);
        return res.render('edit-patient.ejs', {
          patient: rows[0],
          errors: errors.array(),
          formData: req.body
        });
      });
      return;
    }

    const id = req.params.id;
    const { name, email, phone } = req.body;
    const sql = "UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?";

    db.query(sql, [name, email, phone, id], (err, rows) => {
      if (err) return next(err);
      res.redirect('/admin-patients/patients');
    });
  }
)


router.get('/patients/delete/:id', requireAdmin, (req, res, next) => {

  const id = req.params.id
  const sql = "DELETE FROM patients WHERE id = ?";

  db.query(sql, [id], (err, rows) => {
    if (err) return next(err);

    res.redirect('/appointment/list');
  });
});


// For exporting patients records
router.get('/patients/export', requireAdmin, (req, res, next) => {
  const sql = "SELECT name, email, phone FROM patients";

  db.query(sql, (err, rows) => {
    if (err) return next(err);

    let csv = "Name,Email,Phone\n";

    rows.forEach(r => {
      csv += `"${r.name}","${r.email}","${r.phone}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="patients.csv"');

    res.send(csv);
  });
});

// Export router to be used in index.js
module.exports = router