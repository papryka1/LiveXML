module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if(req.isAuthenticated()) {
            return next()
        }
        req.flash('error_msg', 'Please log in to view this')
        res.redirect('/users/login')
    },

    checkNotAuthenticated: (req, res, next) => {
        if(req.isAuthenticated()) {
            return res.redirect('/dashboard')
        }
        next()
    }
}