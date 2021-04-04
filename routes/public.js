const express = require('express')
const router = express.Router()

router.get('/generated/:id', (req, res) => {
    res.send('public/generated id:' + req.params.id)
})

module.exports = router