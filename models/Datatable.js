const mongoose = require('mongoose')

const DatatableSchema = new mongoose.Schema({
    tableName: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    fields: [{
       
    }],
    shared: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = mongoose.model('Datatable', DatatableSchema)