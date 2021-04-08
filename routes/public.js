const express = require('express')
const router = express.Router()
var path = require('path');
var fs = require('fs');

router.get('/generated/:id', (req, res) => {
    var filePath = path.resolve(`public\\generated\\${req.params.id}.xml`)
    if(fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.redirect("../../../dashboard")
    }
})

module.exports = router