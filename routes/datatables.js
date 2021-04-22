const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const isEmpty = require('lodash.isempty')
var fs = require('fs');
const {dataTableLogger, usersLogger}  = require('../utils/logger');

// XML Builder
const { create } = require('xmlbuilder2', { encoding: 'utf-8' })

// String Builder
const StringBuilder = require("string-builder");

// Models
const Datatables = require('../models/Datatable')
const User = require('../models/User')

// New DataTable Page
router.get('/new', auth.ensureAuthenticated, (req, res) => {
    res.render('datatables/new')
})

// Shared DataTables List Page
router.get('/shared', auth.ensureAuthenticated, async (req, res) => {
    try {
        const sharedDataTables = await Datatables.find({ shared: req.user._id }).sort({"dateCreated": -1}).exec()
        if (isEmptyObject(sharedDataTables)) {
            res.render('datatables/shared', {sharedDataTables: sharedDataTables, empty: true})
        } else {
            res.render('datatables/shared', {sharedDataTables: sharedDataTables, empty: false})
        }
    } catch {
        res.redirect('/')
    }
})

// Show Shared DataTable 
router.get('/shared/:id', auth.ensureAuthenticated, async (req, res) => {
    try {
        const dataTable = await Datatables.findById(req.params.id).exec()
        await generateXML(dataTable._id)
        const absolutePath = req.protocol + '://' + req.get('host')  + "/public/generated/" + dataTable._id;
        res.render('datatables/sharedDataTable', { datatable: dataTable, absolutePath: absolutePath })
    } catch (err) {
        console.error(err)
        res.redirect('/shared')
    }
})

// Update Shared DataTable
router.put('/shared/:id', auth.ensureAuthenticated, async (req, res) => {
    try {
        const dataTable = await Datatables.findById(req.params.id).exec()
        var keys = Object.keys(req.body)
        for (let index = 0; index < dataTable.fields.length; index++) {
            dataTable.fields[index][1] = req.body[keys[index]]
        }
        dataTable.markModified('fields');
        await dataTable.save().then(
            dataTableLogger.info("Shared DataTable Updated", { dataTableId: dataTable._id, userId: req.user._id, IP: req.ip})
        )
        // doing full redirect so that _method=PUT would not be left in URL
        res.redirect(`../shared/${dataTable._id}`) 
    } catch (err) {
        console.error(err)
        res.redirect('/dashboard')
    }
})

// DataTable Presets Page
router.get('/presets', auth.ensureAuthenticated, (req, res) => {
    res.render('datatables/presets')
})

// Create User DataTable
router.post('/', auth.ensureAuthenticated, async (req, res) => {
    if(isEmpty(req.body.fieldName || req.body.fieldValue)) {
        res.redirect("datatables/new")
    } else {      
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
            dataTableLogger.info("DataTable Created", { dataTableId: newDataTable._id, userId: req.user._id, IP: req.ip})            
            res.redirect(`datatables/${newDataTable.id}`)
        } catch (err) {
            console.error(err)
            res.redirect('/dashboard')
        }
    } 
})

// Share User DataTable
router.put('/share/:id', auth.ensureAuthenticated, async (req, res) => {
    let dataTable
    try {
        dataTable = await Datatables.findById(req.params.id).exec()
        const user = await User.find({ "email": req.body.shareUserEmail}).exec()
        
        // check to make sure user do not share to himself
        if(req.user._id.toString() == user[0]._id.toString()) {
            req.flash('warning_msg', "You can not share to yourself")
            res.redirect(`../${dataTable._id}`)
        } else {
            try {
                await Datatables.updateOne(
                    { _id:  dataTable._id },
                    { $addToSet: { shared: user[0]._id } }
                ).then(
                    req.flash('success_msg', `DataTable Shared to ${user[0].name}`),
                    dataTableLogger.info("DataTable Shared", { dataTableId: dataTable._id, userId: req.user._id, sharedUserId: user[0]._id, IP: req.ip})
                    )
            } catch (err) {
                console.error(err);
            }
            res.redirect(`../${dataTable._id}`)
        } 
    } catch (err) {
        req.flash('error_msg', `User with email ${req.body.shareUserEmail} does not exists`)
        console.error(err);
        res.redirect('back') 
    }
})

// Update User DataTable Row Value Presets
router.put('/rowvaluepreset/:id', auth.ensureAuthenticated, async (req, res) => {
    let dataTable
    let presetFieldName = req.body.presetFieldName
    let presetFieldValue = req.body.presetFieldValue
    var rowsValuePresets = []
    try {
        dataTable = await Datatables.findById(req.params.id).exec()
        if(isEmpty(req.body.presetFieldName || req.body.presetFieldValue)) {
            dataTable.valuePresets.remove
            dataTable.valuePresets = rowsValuePresets
            dataTable.markModified('valuePresets');
            await dataTable.save().then(
                dataTableLogger.info("DataTable Row Value Presets Cleared", { dataTableId: dataTable._id, userId: req.user._id, IP: req.ip}),
                req.flash('success_msg', "Row value presets cleared successfully!")
            )
            res.redirect('back')
        } else {
            for (let index = 0; index < presetFieldName.length; index++) {    
                const fldN = presetFieldName[index]
                let fldV = presetFieldValue[index]
                fldV = fldV.split(";")
                for (var i = 0; i < fldV.length; i++) {
                    fldV[i] = fldV[i].trim()
                }
                rowsValuePresets.push([fldN, fldV])
            }
            dataTable.valuePresets.remove
            dataTable.valuePresets = rowsValuePresets
            dataTable.markModified('valuePresets');
            await dataTable.save().then(
                dataTableLogger.info("DataTable Row Value Presets Updated", { dataTableId: dataTable._id, userId: req.user._id, IP: req.ip}),
                req.flash('success_msg', "Row value presets updated successfully!")
            ) 
            res.redirect('back')
        }
    } catch (err) {
        console.error(err);
        res.redirect(`/`) 
    }
})

// Unshare other User from Datatable
router.delete('/unshare/:tableId/user/:userId', auth.ensureAuthenticated, async (req, res) => {
    try {
        const dataTable = await Datatables.findById(req.params.tableId).exec()
        const user = await User.findById(req.params.userId).exec()
        await Datatables.updateOne(
            { _id:  dataTable._id },
            { $pull: { shared: user._id }}
        ).then(
            dataTableLogger.info("DataTable Unshared", { dataTableId: dataTable._id, userId: req.user._id, unsharedUserId: user._id, IP: req.ip})
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
        const dataTable = await Datatables.findById(req.params.id).exec()
        if(dataTable.user.toString() == req.user._id.toString() || req.user.userType.toString() == "admin") {
            const sharedUsers = await User.find({_id: dataTable.shared}, {name: 1})
            await generateXML(dataTable._id)
            const absolutePath = req.protocol + '://' + req.get('host')  + "/public/generated/" + dataTable._id;
            res.render('datatables/datatable', { datatable: dataTable, sharedUsers: sharedUsers, absolutePath: absolutePath })    
        } else {
            res.redirect('/')
        }
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
        var keys = Object.keys(req.body)
        keys.shift() //removes first element from array
        for (let index = 0; index < dataTable.fields.length; index++) {
            dataTable.fields[index][1] = req.body[keys[index]]
        }
        dataTable.markModified('fields');
        await dataTable.save().then(
            dataTableLogger.info("DataTable Updated", { dataTableId: dataTable._id, userId: req.user._id, IP: req.ip})
        )
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
        await dataTable.remove().then(
            dataTableLogger.warn("DataTable Deleted", { dataTableId: dataTable._id, userId: req.user._id, IP: req.ip}),
            req.flash('success_msg', "DataTable deleted successfully!")
        )
        res.redirect('/dashboard')
    } catch {
        res.redirect('/dashboard')
    }
})

async function generateXML(dataTableID) {
    try {
        dataTable = await Datatables.findById(dataTableID).exec()
        console.info("Generating XML for _id: " + dataTable._id)

        const sb = new StringBuilder();
        sb.append("<DataTable>")
        for (let index = 0; index < dataTable.fields.length; index++) {
            sb.append("<" + dataTable.fields[index][0] + ">")
            sb.append("<![CDATA[")
            sb.append(dataTable.fields[index][1])
            sb.append("]]>")
            sb.append("</" + dataTable.fields[index][0] + ">")
        }
        sb.append("</DataTable>")

        const doc = await create(sb.toString(), {encoding: 'UTF-8'})
        doc.dec({ encoding: 'utf-8' })

        var fsStream = await fs.createWriteStream(`public\\generated\\${dataTable._id}.xml`);
        fsStream.write(doc.end({ prettyPrint: true }))
        fsStream.end();
    } catch (err) {
        console.error(err)
    } 
}

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

module.exports = router