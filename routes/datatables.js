const express = require('express')
const router = express.Router()
const auth = require('../config/auth')
const isEmpty = require('lodash.isempty')
var fs = require('fs');

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
        const absolutePath = await generateXML(dataTable._id)
        res.render('datatables/sharedDataTable', { datatable: dataTable })
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
        await dataTable.save()  
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
            res.redirect(`datatables/${newDataTable.id}`)
        } catch (err) {
            console.log(err)
            res.redirect('/dashboard')
        }
    } 
})

// Share User DataTable
router.put('/share/:id', auth.ensureAuthenticated, async (req, res) => {
    //console.log("sharing for: " + req.body.shareUserEmail)
    let dataTable
    try {
        dataTable = await Datatables.findById(req.params.id).exec()
        const user = await User.find({ "email": req.body.shareUserEmail}).exec()
        
        // check to make sure user do not share to himself
        if(req.user._id.toString() == user[0]._id.toString()) {
            res.redirect(`../${dataTable._id}`)
        } else {
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
        const sharedUsers = await User.find({_id: dataTable.shared}, {name: 1})

        const allUsersEmail = await User.find({}, {email: 1})

        await generateXML(dataTable._id)
        absolutePath = req.protocol + '://' + req.get('host')  + "/public/generated/" + dataTable._id;
        res.render('datatables/datatable', { datatable: dataTable, sharedUsers: sharedUsers, absolutePath: absolutePath })
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
        console.log("Path: " + fsStream.path)
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