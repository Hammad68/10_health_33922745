// Create a new router
const express = require("express")
const router = express.Router()
const request = require('request')
const { query, validationResult } = require("express-validator");

const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      req.session.msg = 'You must log in to access this page';
      res.redirect('/appointment/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}

// Handle our routes
router.get('/',function(req, res, next){
    res.render('login.ejs', {message : null});
});

router.get('/about',function(req, res, next){
    res.render('about.ejs')
});

router.get('/logout', redirectLogin, (req,res) => {
    req.session.destroy(err => {
    if (err) {
        // return res.redirect('./')
        return res.render('index.ejs');
    }
    res.render('login.ejs', {message : 'You have been logged out successfully...'});
    });
})


// Export the router object so index.js can access it
module.exports = router