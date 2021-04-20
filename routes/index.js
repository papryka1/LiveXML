const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const isEmpty = require('lodash.isempty');

// Models
const Datatables = require('../models/Datatable')
const User = require('../models/User')
const Feedback = require('../models/Feedback')

// Welcome Page
router.get('/', auth.checkNotAuthenticated, (req, res) => {
    res.render('index')
})

// Dashboard Page
router.get('/dashboard', auth.ensureAuthenticated, async (req, res) => {
    try {
        const userTables = await Datatables.find({"user": req.user._id}).sort({"dateCreated": -1}).exec()
        if (isEmptyObject(userTables)) {
            res.render('dashboard', {userTables: userTables, empty: true})
        } else {
            res.render('dashboard', {userTables: userTables, empty: false})
        }
    } catch (err) {
        console.log(err)
        res.render('dashboard')
    }
})

// Contact Us Page
router.get('/contact', auth.ensureAuthenticated, async (req, res) => {
    res.render('contact')
})

// Feedback Submit
router.post('/contact', auth.ensureAuthenticated, async (req, res) => {
    const feedback = new Feedback({
        content: req.body.text,
        user: req.user._id,
    }) 
    try {
        await feedback.save().then(
            req.flash('success_msg', 'Feedback submited successfully')
        )
    } catch (err) {
        console.log(err)
    }
    res.redirect('/dashboard')
})

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

module.exports = router