const express = require('express')
const router = express.Router()
var path = require('path');
var fs = require('fs');

router.get('/generated/:id', (req, res) => {
    if(fs.existsSync(path.resolve(`public\\generated\\${req.params.id}.xml`))) {
        res.sendFile(path.resolve(`public\\generated\\${req.params.id}.xml`));
    } else {
        res.redirect("../../../dashboard")
    }
})

module.exports = router