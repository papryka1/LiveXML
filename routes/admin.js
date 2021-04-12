const express = require('express')
const router = express.Router()
const auth = require('../config/auth')

// Models
const User = require('../models/User')
const Feedback = require('../models/Feedback')

// Admin Page
router.get('/', auth.ensureAuthenticated, async (req, res) => {
    const users = await User.find({}, (err, users) => {
        if (err){
            return res.status(422).send(err)
        }
        if (!users){
            return res.status(422).send({ error:"No data in the collection" })
        }
    })
    const feedbacks = await Feedback.find({}, (err, feedbacks) => {
        if (err){
            return res.status(422).send(err)
        }
        if (!feedbacks){
            return res.status(422).send({ error:"No data in the collection" })
        }
    })
    res.render('admin', {allUsers: users, activeUserId: req.user._id, feedbacks: feedbacks})
})

// Delete Feedback
router.delete('/feedbacks/:id', auth.ensureAuthenticated, async (req, res) => {
    let feedback
    try {
        user = await Feedback.findById(req.params.id).exec()
        await user.remove()
        req.flash('success_msg', "Feedback removed successfully!")
        res.redirect('/admin')
    } catch (err) {
        console.error(err)
        res.redirect('/admin')
    }
})

// Delete User
router.delete('/users/:id', auth.ensureAuthenticated, async (req, res) => {
    let user
    try {
        user = await User.findById(req.params.id).exec()
        await user.remove()
        req.flash('success_msg', "User removed successfully!")
        res.redirect('/admin')
    } catch (err) {
        console.error(err)
        res.redirect('/admin')
    }
})




module.exports = router