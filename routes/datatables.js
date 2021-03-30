const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const isEmpty = require('lodash.isempty');

// Models
const Datatables = require('../models/Datatable')
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

        const datatable = new Datatables({
            tableName: req.body.dataTableName,
            user: req.user._id,
            fields: rows
        }) 

        try {
            const newDataTable = await datatable.save()
            res.redirect(`datatables/${newDataTable.id}`)
        } catch (err) {
            console.log(err)
            res.redirect('/dashboard')
        }
    } 
})

// Share User DataTable
router.put('/share/:id', auth.ensureAuthenticated, async (req, res) => {
    console.log("share " + req.body.shareUserEmail)
    dataTable = await Datatables.findById(req.params.id).exec()
    let user
    try {
        user = await User.find({ "email": req.body.shareUserEmail}).exec()
        if(user.length > 0) {
            console.log(user)
            console.log(user.name)
            try {
                await Datatables.updateOne(
                    { _id:  dataTable._id },
                    { $addToSet: { shared: user._id } }
                )
            } catch (err) {
                console.error(err);
                console.log("Failed Inserting!")
            }
        } else {
            console.log("Share user does not exists!")
        }
        res.redirect(`../${dataTable._id}`) 
    } catch (err) {
        console.error(err);
        res.redirect(`../${dataTable._id}`) 
    }
})

// Show User DataTable 
router.get('/:id', auth.ensureAuthenticated, async (req, res) => {
    try {
        const table = await Datatables.findById(req.params.id).exec()
        res.render('datatables/datatable', { datatable: table })
    } catch (err) {
        res.redirect('/dashboard')
    }
})

// Update DataTable
router.put('/:id', auth.ensureAuthenticated, async (req, res) => {
    console.log(req.body)
    
    let dataTable
    try {
        dataTable = await Datatables.findById(req.params.id).exec()
        dataTable.tableName = req.body.dataTableName
        await dataTable.save()
        
        // doing full redirect so that _method=PUT would not be left in URL
        res.redirect(`${dataTable._id}`) 
    } catch {
        res.redirect('/dashboard')
    }
})

// Delete User DataTable
router.delete('/:id', auth.ensureAuthenticated, async (req, res) => {
    let dataTable
    try {
        dataTable = await Datatables.findById(req.params.id).exec()
        await dataTable.remove()
        res.redirect('/dashboard')
    } catch {
        res.redirect('/dashboard')
    }
})



module.exports = router