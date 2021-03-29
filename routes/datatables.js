const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const isEmpty = require('lodash.isempty');

// Models
const Datatable = require('../models/Datatable')
const User = require('../models/User')

// New DataTable Page
router.get('/new', auth.ensureAuthenticated, (req, res) => {
    res.render('datatables/new')
})

// Shared DataTable Page
router.get('/shared', auth.ensureAuthenticated, (req, res) => {
    res.render('datatables/shared')
})

// DataTable Presets Page
router.get('/presets', auth.ensureAuthenticated, (req, res) => {
    res.render('datatables/presets')
})

// New DataTable
router.post('/', auth.ensureAuthenticated, async (req, res) => {
    if(isEmpty(req.body.fieldName || req.body.fieldValue)) {
        console.log("empty")
        res.redirect("datatables/new")
    } else {
        console.log("not empty")
        
        let fieldNames = req.body.fieldName
        let fieldValues = req.body.fieldValue
        var rows = []

        for (let index = 0; index < fieldNames.length; index++) {
            const fldN = fieldNames[index];
            const fldV = fieldValues[index];
            rows.push([fldN, fldV])
        }

        const datatable = new Datatable({
            tableName: req.body.dataTableName,
            user: req.user._id,
            fields: rows
        }) 

        try {
            const newDataTable = await datatable.save()
            //console.log("New Datatable ID: " + newDataTable.id)
            res.redirect(`datatables/${newDataTable.id}`)
        } catch (err) {
            console.log(err)
        }
    } 
})

// Show DataTable 
router.get('/:id', auth.ensureAuthenticated, async (req, res) => {
    try {
        const table = await Datatable.findById(req.params.id).exec()
        //console.log(table)
        res.render('datatables/datatable', { datatable: table })
    } catch (err) {
        console.log(err)
    }
})

module.exports = router