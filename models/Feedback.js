const mongoose = require('mongoose')

const FeedbackSchema = new mongoose.Schema({
    content: {
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
    }
})

module.exports = mongoose.model('Feedback', FeedbackSchema)