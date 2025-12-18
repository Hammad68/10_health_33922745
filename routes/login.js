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

// Main admin dashboard
router.get('/admin/dashboard', requireAdmin, function (req, res, next) {
    res.render('index.ejs');
})

// Main login page
router.get('/login', requireAdmin, function (req, res, next) {
    const message = req.session.msg;
    delete req.session.msg;
    res.render('login.ejs', { message });
})

// For logging into the system
router.post('/loggedin', 
    [
    check('username').isLength({ min: 1, max: 20 }).isAlphanumeric().withMessage('Username can only contain letters and numbers. Atleast 1 and atmost 20 characters.').trim().escape(), // Sanitize input immediately
    check('password').isLength({ min: 1 }).withMessage('Password cannot be empty.').trim().escape() // Sanitize input immediately
    ],
    function (req, res, next) {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.render('login.ejs', {errors: errors.array(), formData: req.body})
            return;
        }
        else {
            const plainPassword = req.sanitize(req.body.password);
            const username = req.sanitize(req.body.username);
            const ipAddress = req.ip;
            // Save user session here, when login is successful
            req.session.userId = req.body.username;


            // Fetch hashed password for that username
            let sqlquery = 'SELECT username, password, role FROM users WHERE username = ?'

            db.query(sqlquery, [username], (err, result) => {

                if(err){
                    return next(err);
                }

                // User not found
                if(result.length === 0){
                    return res.status(401).send('Invalid username or password');
                }

                const user = result[0];
                const passwordFromDB = user.password;

                // Compare plain password with hashed password
                bcrypt.compare(plainPassword, passwordFromDB, function(err, isMatch) {

                    if (err){
                        return next(err);
                    }

                    // Password correct
                    if(isMatch){
                        auditlogin(username, true, ipAddress);

                        req.session.userId = user.username;
                        req.session.role = user.role;

                        if(user.role === 'staff'){
                            // res.render('index.ejs');
                            return res.redirect('/login/admin/dashboard');
                        }
                        
                        if (user.role === 'patient'){
                            return res.redirect('/patients/dashboard');
                        }

                        return res.status(403).send('Access Denied');
                    }
                    else {
                        // Incorrect password
                        auditlogin(username, false, ipAddress);
                        return res.status(401).send('Invalid username or password... <a href='+'login'+'>Home</a>')
                    }
                });
            });      
        };
    }
);

// Display login audit history
router.get('/audit', requireAdmin, function (req, res, next) {
    let sqlquery = "SELECT * FROM audits ORDER BY login_time DESC"; 
    
    db.query(sqlquery, (err, result) => {
        if (err) return next(err);
        res.render('audit.ejs', { auditHistory: result });
    });
});

// Display patients with online acess
router.get('/online-access', requireAdmin, function (req, res, next) {
    let sqlquery = "SELECT * FROM registered"; 
    
    db.query(sqlquery, (err, result) => {
        if (err) return next(err);
        res.render('online-registered-users.ejs', { onlineAccess: result });
    });
});

// Insert login attempt into audit table
function auditlogin(username, success, ipAddress){
    const auditQuery = "INSERT INTO audits (username, success, ip_address) VALUES (?, ?, ?)";
    global.db.query(auditQuery, [username, success, ipAddress], (err) => {
        if(err) console.log(err);
    });
}

// Export router to be used in index.js
module.exports = router