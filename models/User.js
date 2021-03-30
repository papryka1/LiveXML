const mongoose = require('mongoose')
const Datatable = require('./Datatable')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    userType: {
        type: String,
        default: 'user'
    }
})

UserSchema.pre('remove', function(next) {
    Datatable.find({ user: this.id}, (err, datatables) => {
        if(err) {
            next(err)
        } else if (datatables.length > 0) {
            next(new Error('This user has DataTables!'))
        } else {
            next()
        }
    })
})

module.exports = mongoose.model('User', UserSchema)