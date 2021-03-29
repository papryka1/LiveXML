const express = require('express')
const router = express.Router()
const auth = require('../config/auth')

// Models
const Datatable = require('../models/Datatable')
const User = require('../models/User')

// Welcome Page
router.get('/', auth.checkNotAuthenticated, (req, res) => {
    res.render('index')
})

// Dashboard
router.get('/dashboard', auth.ensureAuthenticated, async (req, res) => {
    try {
        const userTables = await Datatable.find({"user": req.user._id}).sort({"dateCreated": -1}).exec()
        res.render('dashboard', {userTables: userTables})
    } catch (err) {
        console.log(err)
        res.render('dashboard')
    }
})

module.exports = router