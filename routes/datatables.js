const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const isEmpty = require('lodash.isempty')
var fs = require('fs');

// XML Builder
const { create } = require('xmlbuilder2')

// String Builder
const StringBuilder = require("string-builder");

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

// Create User DataTable
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
    console.log("sharing for: " + req.body.shareUserEmail)
    let dataTable
    try {
        dataTable = await Datatables.findById(req.params.id).exec()
        const user = await User.find({ "email": req.body.shareUserEmail}).exec()
        if(user.length > 0) {
            try {
                await Datatables.updateOne(
                    { _id:  dataTable._id },
                    { $addToSet: { shared: user[0]._id } }
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

// Unshare other User from Datatable
router.delete('/unshare/:tableId/user/:userId', auth.ensureAuthenticated, async (req, res) => {
    try {
        const dataTable = await Datatables.findById(req.params.tableId).exec()
        const user = await User.findById(req.params.userId).exec()
        console.info(dataTable)
        console.info(user)
        await Datatables.updateOne(
            { _id:  dataTable._id },
            { $pull: { shared: user._id }}
        )
        
        res.redirect(`../../../${dataTable._id}`)  
    } catch (err) {
        console.error(err);
        res.redirect(`/`)  
    }
})

// Show User DataTable 
router.get('/:id', auth.ensureAuthenticated, async (req, res) => {
    try {
        const table = await Datatables.findById(req.params.id).exec()
        const sharedUsers = await User.find({_id: table.shared}, {name: 1})
        res.render('datatables/datatable', { datatable: table, sharedUsers: sharedUsers })
    } catch (err) {
        console.error(err)
        res.redirect('/dashboard')
    }
})

// Update DataTable
router.put('/:id', auth.ensureAuthenticated, async (req, res) => {
    try {
        const dataTable = await Datatables.findById(req.params.id).exec()
        dataTable.tableName = req.body.dataTableName
        await dataTable.save()  

        //generateXML(dataTable._id, req.body)    

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

async function generateXML(dataTableID, body) {
    try {
        dataTable = await Datatables.findById(dataTableID).exec()
        console.info("Generating XML for _id: " + dataTable._id)
        console.log(body)
        const xmlStr = '<root att="val"><foo><bar>foobar</bar></foo></root>';
        const sb = new StringBuilder();

    } catch (err) {
        console.error(err)
    }     
}

module.exports = router