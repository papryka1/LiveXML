const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const User = require('../models/User')

// Admin Page
router.get('/', auth.ensureAuthenticated, async (req, res) => {
    const users = await User.find({}, (err, users) => {
        if (err){
            return res.status(422).send(err)
        }
        if (!users){
            return res.status(422).send({ error:"No data in the collection" })
        }
        res.render('admin', {allUsers:users})
    })
})


module.exports = router