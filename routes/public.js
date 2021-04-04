const express = require('express')
const router = express.Router()
var path = require('path');

router.get('/generated/:id', (req, res) => {
    res.sendFile(path.resolve(`public\\generated\\${req.params.id}.xml`));
})

module.exports = router